#!/usr/bin/env node
// tools/migrate/joomla.js — import a Joomla site into plain by crawling it (cms-spec.md §15).
//
//   node tools/migrate/joomla.js <site-url> [output-dir]
//       [--max-pages=500] [--delay=250] [--no-media] [--include=/path-prefix]
//
// Joomla has no standard export: content lives in its MySQL database, so this
// importer reads the next best source of truth — the rendered site itself. A
// polite crawl walks every internal link, recognizes Joomla's article markup
// (itemprop microdata, body classes, the .item-page container), converts the
// HTML bodies to Markdown, downloads the images they use, and — non-negotiably
// (§15) — emits a complete old→new redirect map from the *real* URLs it saw.
// It writes into ./plain-import/ by default so it can never clobber the
// working tree. Dependency-free on purpose: node:fs, node:path, global fetch.
//
// Expect a review queue (the spec calls this the messiest path): everything
// the crawler was unsure about lands in MIGRATION-REPORT.md as a ready-to-run
// task for a human or an AI agent, never a silent guess.

import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Frontmatter serializer — mirrors plain's hand-rolled parser (lib/content.js)
// exactly like tools/migrate/jekyll.js does; see the notes there.
// ---------------------------------------------------------------------------

/** True when a string must be quoted to survive plain's round-trip parse. */
function needsQuotes(v) {
  return v === ''
    || /^(true|false)$/.test(v)
    || /^-?\d+(\.\d+)?$/.test(v)
    || /^["']/.test(v)
    || /^\s|\s$/.test(v)
    || /^-\s/.test(v);
}

/** Format a single scalar for a frontmatter line, quoting only when required. */
function fmScalar(value) {
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  const s = String(value).replace(/\r?\n+/g, ' ').trim();   // frontmatter is single-line
  return needsQuotes(s) ? `"${s}"` : s;
}

/** Serialize {data} into a frontmatter block ending in a "---" line + newline. */
function serializeFrontmatter(data, order) {
  const keys = [
    ...order.filter((k) => k in data),
    ...Object.keys(data).filter((k) => !order.includes(k)),
  ];
  const out = ['---'];
  for (const key of keys) {
    const value = data[key];
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      out.push(`${key}:`);
      for (const item of value) out.push(`  - ${fmScalar(item)}`);
    } else {
      out.push(`${key}: ${fmScalar(value)}`);
    }
  }
  out.push('---');
  return out.join('\n') + '\n';
}

/** plain's slug rule (lib/util.js): lowercase, strip accents, non-alnum → "-". */
function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Pull an ISO date (YYYY-MM-DD) out of any datetime-ish string, or null. */
function isoDateOf(value) {
  const m = value == null ? null : String(value).match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

// Where imported content lands, per plain's default config (site.config.json):
// posts at /blog/:slug/ with their list at /blog/, pages at /:slug/. Change
// these together with the collection's urlPattern/listUrl if yours differ.
const postUrl = (slug) => `/blog/${slug}/`;
const pageUrl = (slug) => `/${slug}/`;
const LIST_URL = '/blog/';

// ---------------------------------------------------------------------------
// A tiny HTML parser: tokenize into a {tag, attrs, children} tree that both
// the content extractor and the Markdown serializer walk. Joomla output is
// machine-generated HTML, so this aims for "robust on real templates", not
// spec-grade; a page it can't make sense of goes to the review queue.
// Text nodes are {tag:'#text', text} with entities decoded.
// ---------------------------------------------------------------------------

const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const RAW_TEXT_TAGS = new Set(['script', 'style', 'noscript', 'textarea']);
// Opening one of these implicitly closes an open <p> (the common unclosed-p case).
const P_CLOSERS = new Set(['p', 'div', 'ul', 'ol', 'table', 'blockquote', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'section', 'article', 'figure', 'dl', 'form', 'hr', 'header', 'footer', 'aside', 'nav', 'main']);
// Opening one of these while the same tag is open implicitly closes it first.
const SELF_NESTING = new Set(['li', 'tr', 'td', 'th', 'option', 'dd', 'dt']);

const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  hellip: '…', mdash: '—', ndash: '–', middot: '·', bull: '•',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  laquo: '«', raquo: '»', copy: '©', reg: '®', trade: '™', deg: '°',
  eacute: 'é', egrave: 'è', agrave: 'à', ccedil: 'ç', uuml: 'ü', ouml: 'ö', auml: 'ä', szlig: 'ß', ntilde: 'ñ',
};

function decodeEntities(s) {
  return s.replace(/&(#x?[0-9a-f]+|#\d+|\w+);/gi, (whole, code) => {
    if (code[0] === '#') {
      const n = /^#x/i.test(code) ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      // 0x10ffff is the last valid code point — fromCodePoint throws above it.
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : whole;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? whole;
  });
}

/** Index of the '>' that ends the tag starting at `from`, honoring quoted attributes. */
function findTagEnd(html, from) {
  let quote = null;
  for (let i = from; i < html.length; i++) {
    const c = html[i];
    if (quote) { if (c === quote) quote = null; }
    else if (c === '"' || c === "'") quote = c;
    else if (c === '>') return i;
  }
  return -1;
}

/** Parse an attribute string into a lowercase-keyed object, entities decoded. */
function parseAttrs(s) {
  const attrs = {};
  const re = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let m;
  while ((m = re.exec(s))) attrs[m[1].toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? '');
  return attrs;
}

/** Parse an HTML document (or fragment) into a #root tree. Never throws. */
function parseHtml(html) {
  const root = { tag: '#root', attrs: {}, children: [] };
  const stack = [root];
  const top = () => stack[stack.length - 1];
  const addText = (t) => { if (t) top().children.push({ tag: '#text', text: decodeEntities(t) }); };
  let i = 0;
  while (i < html.length) {
    const lt = html.indexOf('<', i);
    if (lt === -1) { addText(html.slice(i)); break; }
    if (lt > i) addText(html.slice(i, lt));
    if (html.startsWith('<!--', lt)) {                        // comment
      const end = html.indexOf('-->', lt + 4);
      i = end === -1 ? html.length : end + 3;
      continue;
    }
    if (html[lt + 1] === '!' || html[lt + 1] === '?') {       // doctype / processing instruction
      const end = html.indexOf('>', lt);
      i = end === -1 ? html.length : end + 1;
      continue;
    }
    if (html[lt + 1] === '/') {                               // closing tag: pop to match
      const end = html.indexOf('>', lt);
      if (end === -1) break;
      const name = html.slice(lt + 2, end).trim().toLowerCase();
      for (let s = stack.length - 1; s > 0; s--) {
        if (stack[s].tag === name) { stack.length = s; break; }
      }
      i = end + 1;
      continue;
    }
    const end = findTagEnd(html, lt + 1);                     // opening tag
    if (end === -1) { addText(html.slice(lt)); break; }
    const raw = html.slice(lt + 1, end);
    const m = raw.match(/^([a-zA-Z][^\s/>]*)([\s\S]*)$/);
    i = end + 1;
    if (!m) continue;
    const tag = m[1].toLowerCase();
    const selfClosed = /\/\s*$/.test(m[2]);
    if (SELF_NESTING.has(tag) && top().tag === tag) stack.pop();
    if (P_CLOSERS.has(tag) && top().tag === 'p') stack.pop();
    const node = { tag, attrs: parseAttrs(m[2].replace(/\/\s*$/, '')), children: [] };
    top().children.push(node);
    if (RAW_TEXT_TAGS.has(tag) && !selfClosed) {              // swallow raw content
      const close = html.toLowerCase().indexOf('</' + tag, i);
      const stop = close === -1 ? html.length : close;
      if (stop > i) node.children.push({ tag: '#text', text: html.slice(i, stop) });
      const closeEnd = close === -1 ? -1 : html.indexOf('>', close);
      i = closeEnd === -1 ? html.length : closeEnd + 1;
      continue;
    }
    if (!selfClosed && !VOID_TAGS.has(tag)) stack.push(node);
  }
  return root;
}

// ---- tree queries ----------------------------------------------------------

function* iterNodes(node) {
  yield node;
  for (const child of node.children || []) yield* iterNodes(child);
}

const attrOf = (node, name) => node.attrs?.[name] ?? '';
const hasClass = (node, cls) => attrOf(node, 'class').split(/\s+/).includes(cls);
const findAll = (node, pred) => {
  const out = [];
  for (const n of iterNodes(node)) if (n.tag !== '#text' && pred(n)) out.push(n);
  return out;
};
const first = (list) => list[0] ?? null;
const byTag = (node, tag) => findAll(node, (n) => n.tag === tag);
const byClass = (node, cls) => findAll(node, (n) => hasClass(n, cls));
const byAttr = (node, name, value) => findAll(node, (n) => attrOf(n, name) === value);

/** Visible text of a subtree, whitespace collapsed (skips script/style raw text). */
function textOf(node) {
  let s = '';
  const visit = (n) => {
    if (n.tag === '#text') { s += n.text; return; }
    if (RAW_TEXT_TAGS.has(n.tag)) return;
    for (const c of n.children || []) visit(c);
  };
  visit(node);
  return collapse(s);
}
const collapse = (s) => s.replace(/\s+/g, ' ').trim();

/** Text of a subtree with whitespace preserved (for code blocks). */
function rawTextOf(node) {
  let s = '';
  for (const n of iterNodes(node)) if (n.tag === '#text') s += n.text;
  return s;
}

/** Remove matching element nodes anywhere in the subtree (mutates). */
function prune(node, pred) {
  if (!node.children) return node;
  node.children = node.children.filter((c) => c.tag === '#text' || !pred(c));
  for (const c of node.children) prune(c, pred);
  return node;
}

const metaByName = (tree, name) => attrOf(first(findAll(tree, (n) => n.tag === 'meta' && attrOf(n, 'name').toLowerCase() === name)) ?? {}, 'content');
const metaByProp = (tree, prop) => attrOf(first(findAll(tree, (n) => n.tag === 'meta' && attrOf(n, 'property').toLowerCase() === prop)) ?? {}, 'content');

// ---------------------------------------------------------------------------
// HTML → Markdown. Walks an extracted content subtree. Editor-grade HTML
// converts cleanly; anything exotic (iframes, forms, embeds) survives as
// inline HTML plus a review note, never a silent drop.
// ---------------------------------------------------------------------------

const BLOCK_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'blockquote', 'pre', 'table', 'hr', 'figure', 'div', 'section', 'article', 'header', 'footer', 'aside', 'main', 'nav', 'dl', 'dd', 'dt', 'fieldset', 'address', 'center', 'details', 'summary']);
const EXOTIC_TAGS = new Set(['iframe', 'video', 'audio', 'embed', 'object', 'form', 'canvas', 'svg', 'input', 'button', 'select', 'textarea', 'map']);
const escapeHtmlText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Serialize a node back to compact HTML (for exotic markup we keep verbatim). */
function rawHtml(node) {
  if (node.tag === '#text') return escapeHtmlText(node.text);
  const attrs = Object.entries(node.attrs)
    .map(([k, v]) => (v === '' ? k : `${k}="${v.replace(/"/g, '&quot;')}"`))
    .join(' ');
  const open = `<${node.tag}${attrs ? ' ' + attrs : ''}>`;
  if (VOID_TAGS.has(node.tag)) return open;
  return open + (node.children || []).map(rawHtml).join('') + `</${node.tag}>`;
}

/** Escape characters in prose that Markdown would read as formatting. */
const escapeMd = (s) => s.replace(/([\\`*_[\]])/g, '\\$1');
/** Escape a paragraph's first characters if they would read as block syntax. */
const guardBlockStart = (t) => t.replace(/^(\d+)\. /, '$1\\. ').replace(/^([#>+-]) /, '\\$1 ');
/** Markdown link/image destinations break on spaces and parens — encode them. */
const mdUrl = (u) => u.replace(/[ ()]/g, (c) => ({ ' ': '%20', '(': '%28', ')': '%29' }[c]));

/**
 * Convert a content subtree to Markdown.
 * ctx: { link(href) → href′, image(src) → src′, note(text) } — link/image
 * rewrite internal URLs; note() feeds the page's review-queue entry.
 */
function toMarkdown(node, ctx) {
  const keepExotic = (n) => {
    ctx.note(`Kept a <${n.tag}> as raw HTML — check it still works (or replace it) once published.`);
    return rawHtml(n);
  };
  return blocks(node, 0);

  function blocks(parent, depth) {
    const out = [];
    let run = [];
    const flush = () => {
      const text = inline(run).replace(/^[ \t]+|[ \t]+$/gm, '').trim();
      if (text) out.push(guardBlockStart(text));
      run = [];
    };
    for (const child of parent.children || []) {
      if (child.tag === '#text' || (!BLOCK_TAGS.has(child.tag) && !EXOTIC_TAGS.has(child.tag))) {
        run.push(child);
      } else {
        flush();
        const b = block(child, depth);
        if (b) out.push(b);
      }
    }
    flush();
    return out.join('\n\n');
  }

  function block(n, depth) {
    const h = n.tag.match(/^h([1-6])$/);
    if (h) return '#'.repeat(Number(h[1])) + ' ' + inline(n.children).trim();
    switch (n.tag) {
      case 'p': return guardBlockStart(inline(n.children).trim());
      case 'hr': return '---';
      case 'ul': case 'ol': return list(n, depth);
      case 'blockquote':
        return blocks(n, depth).split('\n').map((l) => ('> ' + l).trimEnd()).join('\n');
      case 'pre': return codeBlock(n);
      case 'table': return table(n);
      case 'figure': {
        const img = first(byTag(n, 'img'));
        const cap = first(byTag(n, 'figcaption'));
        const parts = [];
        if (img) parts.push(inline([img]).trim());
        if (cap) { const t = inline(cap.children).trim(); if (t) parts.push(`*${t}*`); }
        return parts.join('\n\n');
      }
      case 'dt': return '**' + inline(n.children).trim() + '**';
      case 'dd': return inline(n.children).trim();
      default:
        if (EXOTIC_TAGS.has(n.tag)) return keepExotic(n);
        return blocks(n, depth);                              // neutral wrapper (div, section, …)
    }
  }

  function list(n, depth) {
    const ordered = n.tag === 'ol';
    const items = (n.children || []).filter((c) => c.tag === 'li');
    const lines = [];
    items.forEach((li, i) => {
      const marker = ordered ? `${i + 1}.` : '-';
      const indent = ' '.repeat(marker.length + 1);
      const body = blocks(li, depth + 1) || inline(li.children).trim();
      const itemLines = body.split('\n');
      lines.push(marker + ' ' + (itemLines[0] ?? ''));
      for (const l of itemLines.slice(1)) lines.push(l ? indent + l : '');
    });
    return lines.join('\n');
  }

  function codeBlock(n) {
    const code = first(byTag(n, 'code')) || n;
    const lang = ((attrOf(code, 'class') + ' ' + attrOf(n, 'class')).match(/language-([\w-]+)/) || [])[1] || '';
    const text = rawTextOf(code).replace(/^\n+/, '').replace(/\s+$/, '');
    const fence = text.includes('```') ? '~~~~' : '```';
    return `${fence}${lang}\n${text}\n${fence}`;
  }

  function table(n) {
    const rows = findAll(n, (x) => x.tag === 'tr');
    if (!rows.length) return '';
    const cellsOf = (tr) => (tr.children || [])
      .filter((c) => c.tag === 'td' || c.tag === 'th')
      .map((c) => inline(c.children).replace(/\s*\n\s*/g, ' ').replace(/\|/g, '\\|').trim());
    const header = cellsOf(rows[0]);
    const lines = [
      '| ' + header.join(' | ') + ' |',
      '| ' + header.map(() => '---').join(' | ') + ' |',
    ];
    for (const tr of rows.slice(1)) {
      const cells = cellsOf(tr);
      if (cells.length) lines.push('| ' + cells.join(' | ') + ' |');
    }
    return lines.join('\n');
  }

  function inline(nodes) {
    let s = '';
    for (const n of Array.isArray(nodes) ? nodes : [nodes]) {
      if (n.tag === '#text') { s += escapeMd(n.text.replace(/\s+/g, ' ')); continue; }
      switch (n.tag) {
        case 'br': s += '\\\n'; break;
        case 'strong': case 'b': s += wrap(inline(n.children), '**'); break;
        case 'em': case 'i': s += wrap(inline(n.children), '*'); break;
        case 'del': case 's': case 'strike': s += wrap(inline(n.children), '~~'); break;
        case 'code': case 'kbd': case 'samp': {
          const t = rawTextOf(n).replace(/\s+/g, ' ').trim();
          if (t) s += t.includes('`') ? '`` ' + t + ' ``' : '`' + t + '`';
          break;
        }
        case 'a': {
          const text = inline(n.children).trim();
          const href = attrOf(n, 'href');
          if (!href || href.startsWith('#')) { s += text; break; }
          if (text) s += `[${text}](${mdUrl(ctx.link(href))})`;
          break;
        }
        case 'img': {
          const src = attrOf(n, 'src');
          if (src) s += `![${escapeMd(collapse(attrOf(n, 'alt')))}](${mdUrl(ctx.image(src))})`;
          break;
        }
        default:
          if (EXOTIC_TAGS.has(n.tag)) s += keepExotic(n);
          else if (RAW_TEXT_TAGS.has(n.tag)) { /* scripts/styles never belong in content */ }
          else s += inline(n.children);                       // span, small, sup, time, …
      }
    }
    return s;
    function wrap(text, mark) {
      const t = text.trim();
      if (!t) return '';
      const pad = text.startsWith(' ') ? ' ' : '';
      const tail = text.endsWith(' ') ? ' ' : '';
      return pad + mark + t + mark + tail;
    }
  }
}

// ---------------------------------------------------------------------------
// URLs and the crawler. Sequential and polite: one request at a time, a
// configurable delay, robots.txt respected, errors recorded — never fatal.
// ---------------------------------------------------------------------------

const TRACKING_PARAM = /^(utm_\w+|fbclid|gclid|mc_cid|mc_eid)$/;
const BINARY_PATH = /\.(jpe?g|png|gif|webp|avif|svg|ico|css|js|mjs|json|xml|txt|pdf|zip|gz|tgz|rar|7z|mp[34]|m4[av]|mov|avi|webm|ogg|woff2?|ttf|eot|otf|docx?|xlsx?|pptx?|epub)$/i;

/**
 * Resolve + canonicalize an internal link. Returns the normalized absolute
 * URL, or null for offsite/non-HTTP links. Strips fragments, tracking params
 * and Joomla session tokens (a 32-hex param with value "1"), sorts the rest,
 * and unifies trailing slashes so each page has exactly one key.
 */
function normalizeUrl(href, base, origin) {
  if (!href || /^(mailto:|tel:|javascript:|data:|#)/i.test(href.trim())) return null;
  let u;
  try { u = new URL(href, base); } catch { return null; }
  if (u.origin !== origin || !/^https?:$/.test(u.protocol)) return null;
  u.hash = '';
  for (const [k, v] of [...u.searchParams]) {
    if (TRACKING_PARAM.test(k) || (/^[0-9a-f]{32}$/.test(k) && v === '1')) u.searchParams.delete(k);
  }
  u.searchParams.sort();
  if (u.pathname !== '/' && u.pathname.endsWith('/')) u.pathname = u.pathname.replace(/\/+$/, '');
  return u.href;
}

/** The site-relative form used for redirect keys and logs: pathname + query. */
function pathOf(url) {
  const u = new URL(url);
  return u.pathname + u.search;
}

/** Print/feed/edit variants that would only duplicate what we already crawl. */
function isSkippableVariant(url) {
  const u = new URL(url);
  const q = u.searchParams;
  if (BINARY_PATH.test(u.pathname)) return true;
  if (/^(feed|pdf|raw|json)$/.test(q.get('format') || '')) return true;
  if (q.get('print') === '1' || q.get('tmpl') === 'component' || q.get('tmpl') === 'raw') return true;
  if (q.get('task') || q.get('layout') === 'edit') return true;
  if (/^(rss|atom)$/.test(q.get('type') || '')) return true;
  return false;
}

/** Fetch one URL with a single retry; never throws. */
async function fetchPage(url) {
  let lastError = 'unreachable';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': 'plain-importer/1.0 (+https://github.com/plain-cms/plain)' },
        redirect: 'follow',
        signal: AbortSignal.timeout(20000),
      });
      const type = res.headers.get('content-type') || '';
      const out = { url, finalUrl: res.url || url, status: res.status };
      if (res.ok && /text\/html|application\/xhtml/.test(type)) out.text = await res.text();
      return out;
    } catch (e) {
      lastError = e?.cause?.code || e?.name || e?.message || 'network error';
    }
  }
  return { url, finalUrl: url, status: 0, error: String(lastError) };
}

/**
 * Minimal robots.txt: Disallow rules from the "User-agent: *" group. Rules
 * are compiled so the two robots wildcards work — "*" matches any run of
 * characters, a trailing "$" anchors the match to the end of the URL.
 */
async function loadRobots(origin) {
  let body;
  try {
    const res = await fetch(origin + '/robots.txt', { signal: AbortSignal.timeout(20000) });
    if (!res.ok) return [];
    body = await res.text();
  } catch { return []; }
  const disallow = [];
  let applies = false;
  let inAgentRun = false;                                     // consecutive User-agent lines form one group
  for (const line of body.split(/\r?\n/)) {
    const rule = line.replace(/#.*$/, '').trim();
    const m = rule.match(/^([\w-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const key = m[1].toLowerCase();
    if (key === 'user-agent') {
      if (!inAgentRun) applies = false;                       // a new group starts
      if (m[2].trim() === '*') applies = true;
      inAgentRun = true;
    } else {
      inAgentRun = false;
      if (key === 'disallow' && applies && m[2].trim()) disallow.push(robotsMatcher(m[2].trim()));
    }
  }
  return disallow;
}

/** One Disallow value → RegExp over pathname+query. */
function robotsMatcher(rule) {
  const anchored = rule.endsWith('$');
  const parts = (anchored ? rule.slice(0, -1) : rule).split('*')
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp('^' + parts.join('.*') + (anchored ? '$' : ''));
}

const isDisallowed = (disallow, url) => {
  const p = pathOf(url);
  return disallow.some((rule) => rule.test(p));
};

/**
 * Breadth-first crawl from startUrl, same-origin only.
 * @returns {{pages: {url, tree}[], aliases: Map, errors: [], robotsSkipped: number,
 *            nonHtml: number, uncrawled: number}}
 */
async function crawl(startUrl, opts, log) {
  let origin = new URL(startUrl).origin;
  let startNorm = normalizeUrl(startUrl, startUrl, origin);
  const queue = [startNorm];
  const enqueued = new Set(queue);
  const seenPages = new Set();
  const pages = [];
  const aliases = new Map();                                   // requested URL → the URL it redirected to
  const errors = [];
  let robotsSkipped = 0;
  let nonHtml = 0;
  let disallow = await loadRobots(origin);

  while (queue.length && pages.length < opts.maxPages) {
    const url = queue.shift();
    if (url !== startNorm && isDisallowed(disallow, url)) { robotsSkipped += 1; continue; }
    const res = await fetchPage(url);
    if (opts.delay > 0) await new Promise((r) => setTimeout(r, opts.delay));
    if (res.error) { errors.push({ url, problem: res.error }); continue; }
    if (res.status >= 400) { errors.push({ url, problem: `HTTP ${res.status}` }); continue; }
    if (res.text == null) { nonHtml += 1; continue; }

    // The server may have redirected. Same-origin redirects are routine
    // (Joomla loves redirecting non-SEF URLs to their SEF form): the final
    // URL is the page's identity; the requested one becomes an alias so
    // redirects still cover it. A redirect to ANOTHER origin is either the
    // site's canonical host (naked → www, http → https — adopt it and crawl
    // there) or genuinely external content, which must not be imported.
    let finalOrigin = origin;
    try { finalOrigin = new URL(res.finalUrl, url).origin; } catch { /* keep ours */ }
    if (finalOrigin !== origin) {
      if (pages.length === 0) {                                // only the start URL can be first
        origin = finalOrigin;
        startNorm = normalizeUrl(res.finalUrl, url, origin) || startNorm;
        disallow = await loadRobots(origin);
        log(`  the site redirected to ${origin} — importing from there`);
      } else {
        errors.push({ url, problem: `redirects off-site to ${res.finalUrl} — not imported` });
        continue;
      }
    }
    const finalNorm = normalizeUrl(res.finalUrl, url, origin) || url;
    if (finalNorm !== url) aliases.set(url, finalNorm);
    if (seenPages.has(finalNorm)) continue;
    seenPages.add(finalNorm);

    const tree = parseHtml(res.text);
    pages.push({ url: finalNorm, tree });
    log(`  ${String(pages.length).padStart(4)}  ${pathOf(finalNorm)}`);

    // <base href> changes how relative links resolve on some templates.
    const baseHref = attrOf(first(byTag(tree, 'base')) ?? {}, 'href');
    const linkBase = baseHref ? new URL(baseHref, finalNorm).href : finalNorm;
    for (const a of byTag(tree, 'a')) {
      const n = normalizeUrl(attrOf(a, 'href'), linkBase, origin);
      if (!n || enqueued.has(n) || isSkippableVariant(n)) continue;
      if (opts.include && !new URL(n).pathname.startsWith(opts.include)) continue;
      enqueued.add(n);
      queue.push(n);
    }
  }
  return { pages, aliases, errors, robotsSkipped, nonHtml, uncrawled: queue.length, origin };
}

// ---------------------------------------------------------------------------
// Joomla page classification and extraction. Fingerprints degrade gracefully:
// itemprop microdata (Protostar, Cassiopeia and most commercial templates emit
// it) → Joomla body classes → common container classes → honest low-confidence
// fallback with a review note.
// ---------------------------------------------------------------------------

const LISTING_VIEWS = new Set(['category', 'categories', 'featured', 'archive', 'tag', 'tags']);
const SKIP_COMPONENTS = {
  com_users: 'login/registration',
  com_contact: 'contact form',
  com_search: 'search',
  com_finder: 'smart search',
  com_mailto: 'email-this-page form',
  com_banners: 'banner click-through',
};

/** What kind of page is this? → {kind: 'article'|'listing'|'component'|'unknown', …} */
function classify(tree, url) {
  const body = first(byTag(tree, 'body'));
  const bodyClass = body ? attrOf(body, 'class') : '';
  const q = new URL(url).searchParams;
  const option = q.get('option') || (bodyClass.match(/\bcom_[a-z_]+\b/) || [''])[0];
  const view = q.get('view') || (bodyClass.match(/\bview-([a-z]+)\b/) || [, ''])[1];

  if (option && option !== 'com_content' && SKIP_COMPONENTS[option]) {
    return { kind: 'component', label: SKIP_COMPONENTS[option] };
  }
  if (LISTING_VIEWS.has(view)) return { kind: 'listing' };
  // An explicit article view is trusted outright — teaser-counting below must
  // not misread a "related articles" sidebar module as a listing page.
  if (view === 'article') return { kind: 'article' };

  const hasArticleRegion = first(byAttr(tree, 'itemprop', 'articleBody'))
    || first(byClass(tree, 'item-page'))
    || first(byTag(tree, 'article'));
  if (hasArticleRegion) {
    // A page of teaser blocks is a listing even when templates use <article>
    // per teaser: multiple articleBody/article blocks with "read more" links.
    const teasers = byClass(tree, 'readmore').length + byClass(tree, 'items-row').length;
    if (teasers >= 2 || byAttr(tree, 'itemprop', 'articleBody').length >= 3) return { kind: 'listing' };
    return { kind: 'article' };
  }
  return { kind: 'unknown' };
}

// Chrome inside the article container that must not become content.
const CHROME_CLASSES = ['article-info', 'articleinfo', 'icons', 'actions', 'btn-group', 'pagenavigation', 'pager', 'breadcrumb', 'tags', 'com-content-article__tags', 'article-index', 'jcomments', 'kmt-wrap', 'social-share', 'addtoany_share_save_container'];

/**
 * Extract one article/page's fields + content subtree.
 * @returns {{title, date, author, tags, description, cover, region, confident, canonical}}
 */
function extractArticle(page, homeOgImage) {
  const { tree, url } = page;
  const bodyEl = first(byTag(tree, 'body')) || tree;

  const container = first(byClass(bodyEl, 'item-page'))
    || first(findAll(bodyEl, (n) => n.tag === 'article'))
    || first(byTag(bodyEl, 'main'))
    || bodyEl;
  const confident = container !== bodyEl || Boolean(first(byAttr(bodyEl, 'itemprop', 'articleBody')));

  // Fields first — the chrome they live in gets pruned before conversion.
  const headline = first(byAttr(container, 'itemprop', 'headline')) || first(byTag(container, 'h1'));
  const title = (headline && textOf(headline))
    || metaByProp(tree, 'og:title')
    || textOf(first(byTag(tree, 'title')) ?? { children: [] });

  const timeEl = first(findAll(container, (n) => n.tag === 'time' && attrOf(n, 'datetime')))
    || first(findAll(container, (n) => attrOf(n, 'itemprop') === 'datePublished'));
  const date = isoDateOf(timeEl && (attrOf(timeEl, 'datetime') || attrOf(timeEl, 'content') || textOf(timeEl)))
    || isoDateOf(metaByProp(tree, 'article:published_time'));

  let author = textOf(first(byAttr(container, 'itemprop', 'author')) ?? { children: [] })
    || textOf(first(byClass(container, 'createdby')) ?? { children: [] });
  author = author.replace(/^(written by|by)\s+/i, '').trim();

  // Category (breadcrumbs, minus "Home"/"You are here" and the page itself)
  // and Joomla tags merge into one tag list, like the Jekyll importer does.
  const tags = [];
  const pushTag = (t) => {
    const v = collapse(String(t));
    if (v && !tags.some((x) => x.toLowerCase() === v.toLowerCase())) tags.push(v);
  };
  const crumbs = first(byClass(tree, 'breadcrumb')) || first(byClass(tree, 'mod-breadcrumbs'));
  if (crumbs) {
    const items = byTag(crumbs, 'li').map((li) => textOf(li)).filter(Boolean)
      .filter((t) => !/^(home|you are here:?)$/i.test(t) && t !== title);
    if (items.length) pushTag(items[items.length - 1]);
  }
  const genre = first(byAttr(tree, 'itemprop', 'genre'));
  if (genre) pushTag(textOf(genre));
  const tagList = first(byClass(container, 'tags')) || first(byClass(tree, 'com-content-article__tags')) || first(byClass(tree, 'tags'));
  if (tagList) for (const a of byTag(tagList, 'a')) pushTag(textOf(a));

  const description = metaByName(tree, 'description') || metaByProp(tree, 'og:description') || '';
  const ogImage = metaByProp(tree, 'og:image');
  const cover = ogImage && ogImage !== homeOgImage ? ogImage : '';

  const canonical = attrOf(first(findAll(tree, (n) => n.tag === 'link' && attrOf(n, 'rel') === 'canonical')) ?? {}, 'href');

  // The content region: the microdata body when present, else the container
  // with its heading and chrome removed.
  let region = first(byAttr(container, 'itemprop', 'articleBody'));
  if (!region) {
    region = container;
    prune(region, (n) => n === headline
      || ['nav', 'aside', 'header', 'footer'].includes(n.tag)
      || CHROME_CLASSES.some((c) => hasClass(n, c)));
  }
  prune(region, (n) => RAW_TEXT_TAGS.has(n.tag) || n.tag === 'link' || n.tag === 'meta');

  return { title: collapse(title), date, author, tags, description: collapse(description), cover, region, confident, canonical };
}

/** Top-level entries of the site's main menu: [{label, href}]. */
function extractMenu(tree) {
  const candidates = byTag(tree, 'ul')
    .filter((ul) => /(^|[\s_-])(nav|menu|mainmenu)([\s_-]|$)/.test(attrOf(ul, 'class') + ' ' + attrOf(ul, 'id')));
  let best = null;
  let bestCount = 0;
  for (const ul of candidates) {
    const count = (ul.children || []).filter((li) => li.tag === 'li' && first(byTag(li, 'a'))).length;
    if (count > bestCount) { best = ul; bestCount = count; }
  }
  if (!best) return [];
  const entries = [];
  for (const li of best.children || []) {
    if (li.tag !== 'li') continue;
    const a = first(byTag(li, 'a'));
    const label = a && textOf(a);
    if (label) entries.push({ label, href: attrOf(a, 'href') });
  }
  return entries;
}

/** Slug from a SEF path segment: "/blog/23-my-post" → "my-post". */
function slugFromUrl(url) {
  const segment = new URL(url).pathname.split('/').filter(Boolean).pop() || '';
  if (!segment || segment === 'index.php') return '';
  return slugify(segment.replace(/\.html?$/i, '').replace(/^\d+-/, ''));
}

/** Media path under media/ for a same-origin asset URL: "/images/a.jpg" → "images/a.jpg". */
function mediaRelOf(url) {
  let pathname = new URL(url).pathname;
  // A stray "%" (e.g. /images/50%off.jpg) makes decodeURIComponent throw —
  // keep the raw path in that case rather than killing the whole import.
  try { pathname = decodeURIComponent(pathname); } catch { /* keep raw */ }
  // Split on backslashes too: a decoded "%5C.." segment must never survive
  // into the path.join() that places the file on disk (Windows would treat
  // it as a directory-traversal separator).
  return pathname.split(/[/\\]+/).filter((s) => s && s !== '.' && s !== '..').join('/');
}

// ---------------------------------------------------------------------------
// The import.
// ---------------------------------------------------------------------------

async function main() {
  const flags = {};
  const positional = [];
  for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--([\w-]+)(?:=(.*))?$/);
    if (m) flags[m[1]] = m[2] ?? true; else positional.push(arg);
  }
  const [siteArg, outputArg] = positional;
  if (!siteArg) {
    console.error('Usage: node tools/migrate/joomla.js <site-url> [output-dir] [--max-pages=500] [--delay=250] [--no-media] [--include=/path-prefix]');
    process.exit(1);
  }
  let start;
  try { start = new URL(/^https?:\/\//i.test(siteArg) ? siteArg : 'https://' + siteArg); }
  catch { console.error(`Not a URL: "${siteArg}" — pass the site's address, e.g. https://example.com`); process.exit(1); }
  const outputDir = path.resolve(outputArg || 'plain-import');
  const opts = {
    maxPages: Math.max(1, Number(flags['max-pages']) || 500),
    delay: flags.delay !== undefined ? Math.max(0, Number(flags.delay) || 0) : 250,
    media: !flags['no-media'],
    include: typeof flags.include === 'string' ? flags.include : null,
  };
  const log = (s) => process.stderr.write(s + '\n');

  log(`Crawling ${start.href} (max ${opts.maxPages} pages, ${opts.delay}ms between requests)…`);
  const crawled = await crawl(start.href, opts, log);
  if (crawled.pages.length === 0) {
    const why = crawled.errors[0] ? `${crawled.errors[0].url} — ${crawled.errors[0].problem}` : 'no crawlable HTML pages found';
    console.error(`Could not read the site: ${why}.\nCheck that the site is online, the URL is right (scheme included), and it serves HTML.`);
    process.exit(1);
  }

  // crawl() may have adopted a different canonical host (naked → www,
  // http → https); every link from here on resolves against the origin the
  // pages actually came from.
  const origin = crawled.origin;
  const generator = metaByName(crawled.pages[0].tree, 'generator');
  if (!/joomla/i.test(generator)) {
    log(`Note: no Joomla generator meta found (saw "${generator || 'nothing'}") — importing anyway; heuristics may be weaker on non-Joomla sites.`);
  }
  const homeOgImage = metaByProp(crawled.pages[0].tree, 'og:image');
  // Read the main menu off the homepage now — extractArticle prunes
  // nav/header out of any tree it processes, including this one.
  const menu = extractMenu(crawled.pages[0].tree);

  // ---- classify & extract ---------------------------------------------------
  const review = [];                                          // {file, notes: []} — file = old URL
  const reviewIndex = new Map();
  const noteFor = (file) => {
    let e = reviewIndex.get(file);
    if (!e) { e = { file, notes: [] }; reviewIndex.set(file, e); review.push(e); }
    return e.notes;
  };
  // The same article often lives at several URLs (menu route, category route,
  // non-SEF). Its canonical link — or title+date — identifies it.
  const dedupKeyOf = (art, fromUrl) =>
    (art.canonical && normalizeUrl(art.canonical, fromUrl, origin)) || `${art.title}|${art.date}`;

  const records = [];                                         // importable articles/pages
  const listings = [];
  const components = new Map();                               // component → count
  const dedup = new Map();                                    // canonical/title|date key → record
  for (const page of crawled.pages) {
    const cls = classify(page.tree, page.url);
    if (cls.kind === 'component') {
      components.set(cls.label, (components.get(cls.label) || 0) + 1);
      continue;
    }
    if (cls.kind === 'listing') { listings.push(page.url); continue; }

    const art = extractArticle(page, homeOgImage);
    if (!art.title) {
      noteFor(pathOf(page.url)).push('No title could be extracted — the page was skipped. If it matters, copy its content into a new page by hand.');
      continue;
    }
    const key = dedupKeyOf(art, page.url);
    const existing = dedup.get(key);
    if (existing) {
      existing.aliasUrls.push(page.url);
      // A canonical-keyed merge is the same article by declaration; a
      // title+date match is only a strong guess — say so, never silently.
      if (!(art.canonical && normalizeUrl(art.canonical, page.url, origin))) {
        noteFor(pathOf(page.url)).push(`Merged into \`${pathOf(existing.url)}\` — same title${art.date ? ' and date' : ''}, and neither page declares a canonical URL. If they were genuinely different pages, copy the missing content over by hand.`);
      }
      continue;
    }
    const record = { url: page.url, ...art, aliasUrls: [] };
    dedup.set(key, record);
    records.push(record);
    if (cls.kind === 'unknown') {
      record.confident = false;
      noteFor(pathOf(page.url)).push('No Joomla article markup found — imported the page’s main content on best effort. Compare it against the original and trim anything that is site chrome.');
    } else if (!art.confident) {
      noteFor(pathOf(page.url)).push('Article container not clearly identifiable — imported the whole page body. Compare against the original and trim site chrome.');
    }
  }
  // Only the extracted regions are needed from here on — release the full
  // page trees so the serialize/media/report phases don't hold every crawled
  // page in memory on large sites.
  for (const page of crawled.pages) page.tree = null;

  // ---- slugs & the old→new URL map -------------------------------------------
  const isHome = (url) => pathOf(url) === '/';
  const seenSlugs = { posts: new Set(), pages: new Set() };
  for (const rec of records) {
    rec.collection = rec.date ? 'posts' : 'pages';            // dated article → post; dateless → page
    if (isHome(rec.url) && !rec.date) { rec.slug = 'index'; rec.newUrl = '/'; seenSlugs.pages.add('index'); continue; }
    let slug = slugFromUrl(rec.url) || slugify(rec.title) || 'untitled';
    if (seenSlugs[rec.collection].has(slug)) {
      let n = 2;
      while (seenSlugs[rec.collection].has(`${slug}-${n}`)) n += 1;
      noteFor(pathOf(rec.url)).push(`Slug "${slug}" collides with another ${rec.collection.slice(0, -1)} — this one was written as "${slug}-${n}". Rename if you prefer.`);
      slug = `${slug}-${n}`;
    }
    seenSlugs[rec.collection].add(slug);
    rec.slug = slug;
    rec.newUrl = rec.collection === 'posts' ? postUrl(slug) : pageUrl(slug);
  }

  const urlToNew = new Map();                                 // normalized old URL → new plain URL
  for (const rec of records) {
    urlToNew.set(rec.url, rec.newUrl);
    for (const alias of rec.aliasUrls) urlToNew.set(alias, rec.newUrl);
  }
  for (const url of listings) if (!isHome(url)) urlToNew.set(url, LIST_URL);
  for (const [from, to] of crawled.aliases) {
    if (!urlToNew.has(from) && urlToNew.has(to)) urlToNew.set(from, urlToNew.get(to));
  }

  // ---- serialize bodies -------------------------------------------------------
  const mediaWanted = new Map();                              // media-relative path → source URL (first seen wins)
  const wantMedia = (abs) => {
    const rel = mediaRelOf(abs);
    if (rel && !mediaWanted.has(rel)) mediaWanted.set(rel, abs);
    return '/media/' + rel;
  };
  for (const rec of records) {
    const notes = noteFor(pathOf(rec.url));
    const seenNotes = new Set();
    const ctx = {
      note: (t) => { if (!seenNotes.has(t)) { seenNotes.add(t); notes.push(t); } },
      link: (href) => {
        const n = normalizeUrl(href, rec.url, origin);
        if (!n) return href;                                  // external / non-http: untouched
        if (BINARY_PATH.test(new URL(n).pathname)) return wantMedia(n);
        return urlToNew.get(n) || pathOf(n);
      },
      image: (src) => {
        let u;
        try { u = new URL(src, rec.url); } catch { return src; }
        if (u.origin !== origin) return src;
        return wantMedia(u.href);
      },
    };
    rec.body = toMarkdown(rec.region, ctx).replace(/\n{3,}/g, '\n\n').trim();
    if (rec.cover) rec.cover = ctx.image(rec.cover);
    if (!rec.body) notes.push('The converted body came out empty — the article region held no convertible content. Check the original page.');
  }

  // ---- write content ----------------------------------------------------------
  const outPosts = path.join(outputDir, 'content', 'posts');
  const outPages = path.join(outputDir, 'content', 'pages');
  fs.mkdirSync(outPosts, { recursive: true });
  fs.mkdirSync(outPages, { recursive: true });
  const written = { posts: 0, pages: 0 };
  for (const rec of records) {
    const fm = { title: rec.title };
    if (rec.collection === 'posts') fm.date = rec.date;
    if (rec.description) fm.description = rec.description;
    if (rec.cover && rec.collection === 'posts') fm.cover = rec.cover;
    if (rec.tags.length && rec.collection === 'posts') fm.tags = rec.tags;
    if (rec.author) fm.author = rec.author;
    const dir = rec.collection === 'posts' ? outPosts : outPages;
    fs.writeFileSync(
      path.join(dir, `${rec.slug}.md`),
      serializeFrontmatter(fm, ['title', 'date', 'description', 'cover', 'tags', 'draft']) + '\n' + rec.body + '\n',
    );
    written[rec.collection] += 1;
  }

  // ---- redirects ----------------------------------------------------------------
  // Path-shaped old URLs go in data/redirects.json (the build turns each key
  // into a fallback page, so keys must be plain paths). Query-string URLs —
  // Joomla's non-SEF index.php?… routes — can't be static files; they're
  // listed in the report as ready-to-paste host rules instead.
  const redirects = {};
  const queryRedirects = {};
  for (const [oldUrl, newUrl] of urlToNew) {
    if (isHome(oldUrl)) continue;
    const oldPath = pathOf(oldUrl);
    if (oldPath.includes('?')) {
      // Pagination of a listing collapses into the listing's own redirect.
      if (!new URL(oldUrl).searchParams.has('start')) queryRedirects[oldPath] = newUrl;
      continue;
    }
    // Keys keep the old site's real URL shape: directory-style paths get the
    // trailing slash plain's redirect convention uses; file-style paths
    // (.html and friends) are already exact and must stay slash-free.
    const key = /\.[a-z0-9]+$/i.test(oldPath) ? oldPath : oldPath + '/';
    if (key !== newUrl) redirects[key] = newUrl;
  }
  const sortedRedirects = {};
  for (const key of Object.keys(redirects).sort()) sortedRedirects[key] = redirects[key];
  fs.mkdirSync(path.join(outputDir, 'data'), { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'data', 'redirects.json'), JSON.stringify(sortedRedirects, null, 2) + '\n');

  // ---- navigation ---------------------------------------------------------------
  const navigation = [];
  for (const { label, href } of menu) {
    const n = normalizeUrl(href, crawled.pages[0].url, origin);
    let url;
    if (!n) {
      try { url = new URL(href, crawled.pages[0].url).href; } catch { continue; }  // external link kept whole
    } else {
      url = isHome(n) ? '/' : urlToNew.get(n) || (listings.includes(n) ? LIST_URL : null);
      if (!url) continue;                                     // menu entry to a page we didn't import
    }
    if (!navigation.some((e) => e.url === url)) navigation.push({ label, url });
  }
  if (navigation.length) {
    fs.writeFileSync(path.join(outputDir, 'data', 'navigation.json'), JSON.stringify(navigation, null, 2) + '\n');
  }

  // ---- media --------------------------------------------------------------------
  let mediaCount = 0;
  if (opts.media && mediaWanted.size) {
    log(`Downloading ${mediaWanted.size} media file(s)…`);
    for (const [rel, abs] of [...mediaWanted.entries()].sort()) {
      try {
        const res = await fetch(abs, { signal: AbortSignal.timeout(30000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        // Check the declared size before buffering the body, so a linked
        // archive can't pull hundreds of MB into memory first.
        const cap = 20 * 1024 * 1024;
        if (Number(res.headers.get('content-length')) > cap) throw new Error('larger than 20 MB');
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > cap) throw new Error('larger than 20 MB');
        const target = path.join(outputDir, 'media', rel);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, buf);
        mediaCount += 1;
      } catch (e) {
        noteFor(pathOf(abs)).push(`Image download failed (${e.message}) — fetch it yourself into media/${rel}, or fix the reference.`);
      }
      if (opts.delay > 0) await new Promise((r) => setTimeout(r, opts.delay));
    }
  } else if (!opts.media && mediaWanted.size) {
    noteFor('media').push(`--no-media: ${mediaWanted.size} image reference(s) were rewritten to /media/… but not downloaded — copy them from the old site into media/.`);
  }

  // ---- report ---------------------------------------------------------------------
  review.sort((a, b) => a.file.localeCompare(b.file));
  const report = buildReport({
    startUrl: start.href, outputDir, generator, written, listings, components,
    mediaCount, mediaWanted: mediaWanted.size, redirects: sortedRedirects, queryRedirects,
    review, crawled, opts,
  });
  fs.writeFileSync(path.join(outputDir, 'MIGRATION-REPORT.md'), report);
  process.stdout.write(report);
}

/** Assemble the human-readable migration report (stdout + MIGRATION-REPORT.md). */
function buildReport({ startUrl, outputDir, generator, written, listings, components, mediaCount, mediaWanted, redirects, queryRedirects, review, crawled, opts }) {
  const L = [];
  L.push('# Joomla → plain migration report', '');
  L.push(`- Source: \`${startUrl}\` (crawled ${crawled.pages.length} page(s))`);
  if (generator) L.push(`- Generator: ${generator}`);
  L.push(`- Output: \`${outputDir}\``, '');

  L.push('## Converted', '');
  L.push(`- Posts converted: ${written.posts} → \`content/posts/*.md\``);
  L.push(`- Pages converted: ${written.pages} → \`content/pages/*.md\``);
  L.push(`- Listing pages seen (crawled through, not imported — plain rebuilds its own lists): ${listings.length}`);
  L.push(`- Media files downloaded: ${mediaCount}${opts.media ? '' : ` (skipped by --no-media; ${mediaWanted} referenced)`}`);
  L.push(`- Redirects mapped: ${Object.keys(redirects).length} → \`data/redirects.json\``);
  for (const [label, count] of [...components.entries()].sort()) {
    L.push(`- Skipped ${count} ${label} page(s) — see the dynamic-feature table below`);
  }
  if (crawled.robotsSkipped) L.push(`- Skipped ${crawled.robotsSkipped} URL(s) disallowed by robots.txt`);
  if (crawled.uncrawled) L.push(`- **--max-pages reached with ${crawled.uncrawled} URL(s) still un-crawled** — rerun with a higher \`--max-pages\` for full coverage`);
  L.push('');

  if (crawled.errors.length) {
    L.push('## Fetch errors', '');
    for (const e of crawled.errors) L.push(`- \`${pathOf(e.url)}\` — ${e.problem}`);
    L.push('');
  }

  L.push('## Redirects (old Joomla URL → new plain URL)', '');
  if (Object.keys(redirects).length === 0) L.push('_None — every URL is unchanged._', '');
  else { for (const [from, to] of Object.entries(redirects)) L.push(`- \`${from}\` → \`${to}\``); L.push(''); }

  const qr = Object.entries(queryRedirects).sort(([a], [b]) => a.localeCompare(b));
  if (qr.length) {
    L.push('## Non-SEF URLs (need host-level rules)', '');
    L.push('These old URLs use query strings, which static redirect files cannot express. If they still get traffic, add rules at your host (Cloudflare Bulk Redirects, Netlify supports query matching in `_redirects`); otherwise the path redirects above cover normal navigation.', '');
    for (const [from, to] of qr) L.push(`- \`${from}\` → \`${to}\``);
    L.push('');
  }

  L.push('## Review queue', '');
  L.push('_Items the importer could not convert with full confidence. Each is a ready-to-run task for a human or an AI agent._', '');
  if (review.length === 0) L.push('_Empty — everything converted cleanly._', '');
  else for (const entry of review) { L.push(`### \`${entry.file}\``); for (const note of entry.notes) L.push(`- ${note}`); L.push(''); }

  L.push('## Dynamic-feature mapping (honest scoping)', '');
  L.push('Joomla is a server-side CMS; plain is static. Here is where each dynamic piece goes:', '');
  L.push('| Joomla feature | plain equivalent |');
  L.push('| --- | --- |');
  L.push('| Contact forms (com_contact, RSForm, …) | `contact-form` plugin (POSTs to Formspree or your own Worker) |');
  L.push('| Comments (JComments, Komento, Disqus) | Static archive JSON, or the giscus plugin (GitHub Discussions) |');
  L.push('| Search (com_search, Smart Search) | Built-in `search` plugin over the prebuilt index |');
  L.push('| Categories & tags | Merged into each post’s `tags` list — plain emits tag pages |');
  L.push('| RSS feeds | Built in — set `rss: true` on the posts collection |');
  L.push('| Users, ACL, frontend login | No equivalent — plain sites are fully public; authors publish through the admin |');
  L.push('| Modules (custom HTML, banners) | Move the content into page bodies or the theme; no module system |');
  L.push('| E-commerce (VirtueMart, HikaShop) | Out of scope for a static CMS — use a dedicated service |');
  L.push('');

  L.push('## Next step', '');
  L.push('Copy the generated folders into your plain repository, then build:', '');
  L.push('```sh');
  L.push(`cp -R "${path.join(outputDir, 'content')}/." content/`);
  L.push(`cp -R "${path.join(outputDir, 'media')}/." media/    # if media/ was created`);
  L.push(`# merge "${path.join(outputDir, 'data', 'redirects.json')}" into your data/redirects.json`);
  L.push(`# review "${path.join(outputDir, 'data', 'navigation.json')}" against your data/navigation.json`);
  L.push('node build.js');
  L.push('```', '');
  return L.join('\n');
}

await main();
