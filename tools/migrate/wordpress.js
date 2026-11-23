#!/usr/bin/env node
// tools/migrate/wordpress.js — import a WordPress site into plain (cms-spec.md §15).
//
//   node tools/migrate/wordpress.js <export.xml> [output-dir]
//       [--uploads=path/to/wp-content/uploads] [--no-media] [--delay=100]
//
// Input is the file WordPress gives you at Tools → Export → All content (the
// "WXR" format; WordPress.com exports are the same file). Everything a site
// owner wrote lives in it: posts, pages, categories, tags, menus, comments,
// and the address of every uploaded file.
//
// What happens, in order:
//   1. read the export                    (readWxr)
//   2. decide every new URL, and the redirect from each old one
//   3. convert each post/page body to Markdown (classic editor, Gutenberg
//      blocks, and the common shortcodes), rewriting links and images
//   4. fetch the uploaded files the content uses into media/YYYY/MM/ —
//      the same folders the plain admin uses
//   5. write content/, data/redirects.json, data/navigation.json,
//      data/comments.json, and MIGRATION-REPORT.md
//
// It writes into ./plain-import/ by default, so it can never clobber your
// working tree. Anything it isn't sure about goes to the report's review
// queue as a ready-to-run task, never a silent guess. Dependency-free on
// purpose: node:fs, node:path, and global fetch (Node 18+).
//
// The HTML parser and HTML → Markdown converter are shared in spirit with
// tools/migrate/joomla.js (each importer stays one self-contained file you
// can read top to bottom); the WordPress-specific tweaks are marked "WP:".

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
  // Frontmatter is single-line — and plain's parser ends a line at \r, U+2028 and U+2029 too.
  const s = String(value).replace(/[\r\n\u2028\u2029]+/g, ' ').trim();
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

// ---------------------------------------------------------------------------
// A tiny HTML parser: tokenize into a {tag, attrs, children} tree that both
// the Markdown serializer walks. WordPress content is editor-generated HTML,
// so this aims for "robust on real posts", not spec-grade; anything it can't
// make sense of goes to the review queue.
// Text nodes are {tag:'#text', text} with entities decoded.
// ---------------------------------------------------------------------------

const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const RAW_TEXT_TAGS = new Set(['script', 'style', 'noscript', 'textarea']);
// Opening one of these implicitly closes an open <p> (the common unclosed-p case).
const P_CLOSERS = new Set(['p', 'div', 'ul', 'ol', 'table', 'blockquote', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'section', 'article', 'figure', 'dl', 'form', 'hr', 'header', 'footer', 'aside', 'nav', 'main']);
// Opening one of these while the same tag is open implicitly closes it first.
const SELF_NESTING = new Set(['li', 'tr', 'td', 'th', 'option', 'dd', 'dt']);
// Element names a post can really contain. "<" before any other word ("if n<k")
// is prose typed in the Text tab — kept as text rather than hidden like a browser
// would. Names with ":" or "-" (Word's <o:p>, custom elements) count as tags too.
const HTML_TAGS = new Set(('a abbr acronym address area article aside audio b base bdi bdo big blockquote body br button canvas caption center cite code col colgroup data datalist dd del details dfn dialog dir div dl dt em embed fieldset figcaption figure font footer form frame frameset h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark marquee math menu meta meter nav nobr noscript object ol optgroup option output p param picture pre progress q rp rt ruby s samp script section select small source span strike strong style sub summary sup svg table tbody td template textarea tfoot th thead time title tr track tt u ul var video wbr '
  + 'path g circle rect line polyline polygon ellipse text tspan defs use symbol lineargradient radialgradient stop clippath mask image foreignobject').split(' '));

// Deeper than this is never real content — only unclosed tags pile up so far.
const MAX_DEPTH = 200;

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

/**
 * Index of the '>' that ends the tag starting at `from`, honoring quoted
 * attribute values. Like a browser, a quote only opens a value right after
 * "=" — so the apostrophe in "if n<k it's fine" can't swallow the post.
 */
function findTagEnd(html, from) {
  let quote = null;
  let prev = '';
  for (let i = from; i < html.length; i++) {
    const c = html[i];
    if (quote) { if (c === quote) { quote = null; prev = c; } continue; }
    if ((c === '"' || c === "'") && prev === '=') quote = c;
    else if (c === '>') return i;
    if (!/\s/.test(c)) prev = c;
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
    // A "<" that can't start a tag ("x < 5", "I <3 this", "< €20") is just text,
    // as it is in a browser — only "<a", "</a", "<!" and "<?" begin markup.
    if (!/^<(?:[a-zA-Z]|\/[a-zA-Z]|!|\?)/.test(html.slice(lt, lt + 3))) { addText('<'); i = lt + 1; continue; }
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
      const name = end === -1 ? '' : (html.slice(lt + 2, end).match(/^[a-zA-Z][^\s/>]*/) || [''])[0].toLowerCase();
      if (!HTML_TAGS.has(name) && !/[:-]/.test(name) && !stack.some((n) => n.tag === 'svg' || n.tag === 'math')) { addText('<'); i = lt + 1; continue; }
      for (let s = stack.length - 1; s > 0; s--) {
        if (stack[s].tag === name) { stack.length = s; break; }
      }
      i = end + 1;
      continue;
    }
    const end = findTagEnd(html, lt + 1);                     // opening tag
    if (end === -1) { addText('<'); i = lt + 1; continue; }   // never closed: just a literal less-than
    const raw = html.slice(lt + 1, end);
    const m = raw.match(/^([a-zA-Z][^\s/>]*)([\s\S]*)$/);
    const inForeign = stack.some((n) => n.tag === 'svg' || n.tag === 'math');   // MathML / SVG have their own element names
    if (m && !inForeign && !HTML_TAGS.has(m[1].toLowerCase()) && !/[:-]/.test(m[1])) { addText('<'); i = lt + 1; continue; }
    i = end + 1;
    if (!m) continue;
    const tag = m[1].toLowerCase();
    const selfClosed = /\/\s*$/.test(m[2]);
    if (SELF_NESTING.has(tag) && top().tag === tag) stack.pop();
    if (P_CLOSERS.has(tag) && top().tag === 'p') stack.pop();
    const node = { tag, attrs: parseAttrs(m[2].replace(/\/\s*$/, '')), children: [] };
    // Pasted markup with an unclosed <font> on every line would nest thousands
    // deep and overflow the stack later — past a sane depth, stop nesting
    // further and add new elements beside the deepest one instead.
    if (stack.length > MAX_DEPTH) stack.length = MAX_DEPTH;
    top().children.push(node);
    if (RAW_TEXT_TAGS.has(tag) && !selfClosed) {              // swallow raw content
      const close = html.toLowerCase().indexOf('</' + tag, i);
      const stop = close === -1 ? html.length : close;
      // A <textarea>'s text is RCDATA: entities count there (a browser shows &lt; as "<").
      if (stop > i) node.children.push({ tag: '#text', text: tag === 'textarea' ? decodeEntities(html.slice(i, stop)) : html.slice(i, stop) });
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
const EXOTIC_TAGS = new Set(['iframe', 'video', 'audio', 'embed', 'object', 'form', 'canvas', 'svg', 'math', 'input', 'button', 'select', 'textarea', 'map']);
const escapeHtmlText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Serialize a node back to compact HTML (for exotic markup we keep verbatim). */
// Tags whose direct text/<br> children are only source formatting (a browser
// moves a stray <br> there out in front of the table).
const TABLE_STRUCTURE = new Set(['table', 'thead', 'tbody', 'tfoot', 'tr', 'colgroup']);

/**
 * Serialize a node back to HTML on one line (for exotic markup we keep
 * verbatim). It lands in Markdown as an HTML block, which a blank line or an
 * indented line would end early — so whitespace collapses, and newlines
 * inside <pre> are written as &#10;.
 */
function rawHtml(node, inPre = false) {
  if (node.tag === '#text') return inPre ? escapeHtmlText(node.text).replace(/\r?\n/g, '&#10;') : escapeHtmlText(node.text).replace(/\s+/g, ' ');
  const attrs = Object.entries(node.attrs)
    .map(([k, v]) => (v === '' ? k : `${k}="${v.replace(/"/g, '&quot;')}"`))
    .join(' ');
  const open = `<${node.tag}${attrs ? ' ' + attrs : ''}>`;
  if (VOID_TAGS.has(node.tag)) return open;
  const pre = inPre || node.tag === 'pre' || node.tag === 'textarea';
  const kids = (node.children || []).filter((c) => !TABLE_STRUCTURE.has(node.tag) || !((c.tag === '#text' && !c.text.trim()) || c.tag === 'br'));
  return open + kids.map((c) => rawHtml(c, pre)).join('') + `</${node.tag}>`;
}

// A URL stops at a space, "<", ">", a double quote, or punctuation that never
// sits inside one — CJK sentence marks (text there has no spaces), "…" and "—".
const URL_OR_EMAIL = /(?:https?:\/\/|www\.)[^\s<>"。、，！？；：…—」』）]+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const escapeText = (t) => t.replace(/([\\`*_[\]~])/g, '\\$1');

/** Split text into [text, url, text, url, …]. A "]" ends a URL unless the URL opened a "[" (?ids[]=1). */
function splitUrls(s) {
  const parts = [];
  let at = 0;
  for (const m of s.matchAll(URL_OR_EMAIL)) {
    let url = m[0];
    const count = (c) => url.split(c).length - 1;
    // Trim what can't end a URL, until nothing changes: sentence punctuation,
    // closing quotes, brackets and sentence marks outside ASCII (’ ” » 」 … 。), and a "]" or ")"
    // the URL never opened ("[source: https://x.test/a]." → https://x.test/a).
    for (let before = ''; before !== url;) {
      before = url;
      url = url.replace(/[.,:;!?’”»›」』）…。、，！？¡¿]+$/u, '');
      if ((url.endsWith(']') && count(']') > count('[')) || (url.endsWith(')') && count(')') > count('('))) url = url.slice(0, -1);
    }
    if (m.index < at || !url) continue;
    parts.push(s.slice(at, m.index), url);
    at = m.index + url.length;
  }
  parts.push(s.slice(at));
  return parts;
}

/**
 * Escape prose so Markdown shows it literally: formatting characters get a
 * backslash, and "<" / "&entity;" are re-encoded — the parser already decoded
 * them, so a post *about* "&lt;script&gt;" must not turn into a live tag.
 * URLs are left whole so they still autolink. In a heading, "<" and "&" get a
 * backslash instead (the anchor id is built from the Markdown text, and
 * "&lt;" would read "lt"); inside link text a URL is plain text.
 */
const escapeMd = (s, inHeading = false, inLink = false, glued = false) => {
  const parts = splitUrls(s);
  return parts.map((part, i) => {
    if (i % 2) {
      if (inLink) return escapeText(part);
      // A bare URL ends where Markdown says it does: anything but a space or
      // ordinary trailing punctuation right after it would be swallowed into
      // it, and a trailing "*", "_" or "~" cut off. <…> marks its exact end.
      // "glued": the text node ends here and more inline markup follows ("**", "`").
      // Safe to leave bare only when what follows is a space, the end, or
      // ASCII punctuation (which Markdown trims) and then a space or the end.
      const next = (parts[i + 1] || '') + (glued && i === parts.length - 2 ? 'x' : '');
      const exact = /[*_~]$/.test(part) || !/^[.,:;!?)'"]*(?:\s|$)/.test(next);
      if (!exact) return part;
      // <…> needs a scheme — a www. address keeps its visible text as a link instead.
      return part.startsWith('www.') ? `[${escapeText(part)}](http://${part})` : `<${part}>`;
    }
    const t = escapeText(part);
    return inHeading ? t.replace(/([<>&])/g, '\\$1')
      : t.replace(/&(?=#?\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }).join('');
};
/** Escape a line's first characters if Markdown would read them as block syntax. */
function guardBlockStart(t) {
  if (/^(#{1,6}(\s|$)|>|[-+*](\s|$)|~{3,}|(=+|-+)\s*$)/.test(t)) return '\\' + t;
  return t.replace(/^(\d{1,9})([.)])(?=\s|$)/, '$1\\$2');
}
/** Every line of a paragraph can start a block after a hard break — guard each. */
const guardLines = (t) => t.split('\n').map(guardBlockStart).join('\n');
/** Tidy a paragraph: no indents, no hard breaks at the very start or end. */
const tidyParagraph = (t) => guardLines(t.replace(/^[ \t]+|[ \t]+$/gm, '').replace(/^(\\\n)+|(\\\n)+$/g, '').trim());
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
    // WP: kept HTML still gets its links and media rewritten (a [video] file is fetched like an image).
    for (const x of iterNodes(n)) {
      if (!x.attrs) continue;
      for (const a of ['src', 'poster']) if (x.attrs[a]) x.attrs[a] = ctx.image(x.attrs[a]);
      if (x.attrs.href) x.attrs.href = ctx.link(x.attrs.href);
    }
    return rawHtml(n);
  };
  let inHeading = false;
  let inLink = false;
  return blocks(node, 0);

  function blocks(parent, depth) {
    const out = [];
    let run = [];
    let lastList = null;
    const flush = () => {
      const text = tidyParagraph(inline(run));
      if (text) { out.push(text); lastList = null; }
      run = [];
    };
    for (const child of parent.children || []) {
      if (child.tag === '#text' || (!BLOCK_TAGS.has(child.tag) && !EXOTIC_TAGS.has(child.tag))) {
        run.push(child);
      } else {
        flush();
        const b = block(child, depth);
        if (!b) continue;
        // WP: two lists in a row would merge into one in Markdown — keep them apart.
        if (lastList && lastList === child.tag) out.push('<!-- -->');
        lastList = child.tag === 'ul' || child.tag === 'ol' ? child.tag : null;
        out.push(b);
      }
    }
    flush();
    return out.join('\n\n');
  }

  function block(n, depth) {
    const h = n.tag.match(/^h([1-6])$/);
    if (h) {
      // WP: headings are already bold — drop emphasis there, so the heading's
      // anchor id isn't built from "<strong>" fallback tags.
      inHeading = true;
      try { return '#'.repeat(Number(h[1])) + ' ' + oneLine(inline(n.children)); } finally { inHeading = false; }
    }
    switch (n.tag) {
      case 'p': return tidyParagraph(inline(n.children));
      case 'hr': return '---';
      case 'ul': case 'ol': return list(n, depth);
      case 'blockquote':
        return blocks(n, depth).split('\n').map((l) => ('> ' + l).trimEnd()).join('\n');
      case 'pre':
        // WP: a verse (poetry) block is text with line breaks, not source code.
        // Its indents are kept as no-break spaces. Every other <pre> is code.
        if (hasClass(n, 'wp-block-verse')) return tidyParagraph(inline(withBreaks(n.children))).replace(/\u0005/g, '&nbsp;');
        return codeBlock(n);
      case 'table': return table(n);
      case 'figure': {
        // WP: gallery blocks nest one <figure> per image; embed, table and quote
        // blocks are figures with no image at all. Both convert child by child.
        if (byTag(n, 'img').length !== 1) return blocks(n, depth);
        const img = first(byTag(n, 'img'));
        const cap = first(byTag(n, 'figcaption'));
        // WP: keep a link around the image (often to the full-size file).
        const a = first(findAll(n, (x) => x.tag === 'a' && byTag(x, 'img').length > 0));
        const href = a ? attrOf(a, 'href') : '';
        const parts = [];
        let imgMd = inline([img]).trim();
        if (imgMd && href && !href.startsWith('#')) imgMd = `[${imgMd}](${mdUrl(ctx.link(href))})`;
        if (imgMd) parts.push(imgMd);
        if (cap) { const t = oneLine(inline(cap.children)); if (t) parts.push(`*${t}*`); }
        return parts.join('\n\n');
      }
      case 'dt': return '**' + oneLine(inline(n.children)) + '**';
      case 'dd': return tidyParagraph(inline(n.children));
      default:
        if (EXOTIC_TAGS.has(n.tag)) return keepExotic(n);
        return blocks(n, depth);                              // neutral wrapper (div, section, …)
    }
  }

  /**
   * Newlines in text become <br> nodes, so inline() keeps them as hard breaks;
   * indents and runs of spaces become a \u0005 placeholder per space (inline()
   * would collapse real spaces) that the caller turns into &nbsp;.
   */
  function withBreaks(nodes, state = { lineStart: true }) {
    const indent = (sp) => '\u0005'.repeat(sp.replace(/\t/g, '    ').length);
    const keepSpaces = (t) => {
      let out = t.replace(/\n([ \t]+)/g, (_m, sp) => '\n' + indent(sp)).replace(/ {2,}/g, (sp) => ' ' + '\u0005'.repeat(sp.length - 1));
      if (state.lineStart) out = out.replace(/^[ \t]+/, indent);
      if (t) state.lineStart = t.endsWith('\n');
      return out;
    };
    return nodes.flatMap((c) => {
      if (c.tag === 'br') state.lineStart = true;
      if (c.tag !== '#text') return [{ ...c, children: c.children && withBreaks(c.children, state) }];
      return keepSpaces(c.text).split('\n').flatMap((t, i) => (i ? [{ tag: 'br', attrs: {}, children: [] }, { tag: '#text', text: t }] : [{ tag: '#text', text: t }]));
    });
  }

  /** Headings, captions and table cells are one line: a <br> becomes a space. */
  function oneLine(text) {
    return text.replace(/\\\n/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function list(n, depth) {
    const ordered = n.tag === 'ol';
    const parsed = parseInt(attrOf(n, 'start'), 10);
    const start = ordered && Number.isFinite(parsed) ? parsed : 1;   // WP: <ol start="5">
    // Markdown can't count down or below zero — keep those lists as HTML.
    if (ordered && ('reversed' in n.attrs || start < 0)) return keepExotic(n);
    const items = (n.children || []).filter((c) => c.tag === 'li');
    const lines = [];
    items.forEach((li, i) => {
      const marker = ordered ? `${start + i}.` : '-';
      const indent = ' '.repeat(marker.length + 1);
      const body = blocks(li, depth + 1) || tidyParagraph(inline(li.children));
      const itemLines = body.split('\n');
      lines.push(marker + ' ' + (itemLines[0] ?? ''));
      for (const l of itemLines.slice(1)) lines.push(l ? indent + l : '');
    });
    return lines.join('\n');
  }

  function codeBlock(n) {
    const code = first(byTag(n, 'code')) || n;
    const lang = ((attrOf(code, 'class') + ' ' + attrOf(n, 'class')).match(/(?:language-|lang-|brush:\s*)([\w-]+)/) || [])[1] || '';   // WP: SyntaxHighlighter writes "brush: js"
    // WP: the classic editor often breaks code lines with <br>, not newlines.
    let raw = '';
    for (const x of iterNodes(code)) raw += x.tag === '#text' ? x.text : x.tag === 'br' ? '\n' : '';
    const text = raw.replace(/^\n+/, '').replace(/\s+$/, '');
    const fence = text.includes('```') ? '~~~~' : '```';
    return `${fence}${lang}\n${text}\n${fence}`;
  }

  function table(n) {
    const rows = findAll(n, (x) => x.tag === 'tr');
    if (!rows.length) return '';
    // A Markdown table has one header row, every row the same width and only
    // inline content in its cells. Merged cells, ragged rows, a table inside a
    // table (old layout tables) or lists in cells would lose content — keep those as HTML.
    const widths = rows.map((tr) => (tr.children || []).filter((c) => c.tag === 'td' || c.tag === 'th').length).filter(Boolean);
    const allCells = findAll(n, (x) => x.tag === 'td' || x.tag === 'th');
    if (allCells.some((x) => Number(attrOf(x, 'colspan')) > 1 || Number(attrOf(x, 'rowspan')) > 1)
      || widths.some((w) => w !== widths[0])
      || allCells.some((x) => findAll(x, (y) => /^(table|ul|ol|pre|blockquote|h[1-6]|figure|dl)$/.test(y.tag)).length)) return keepExotic(n);
    // A hard break in a cell stays a <br> (one line per row in Markdown).
    const cellsOf = (tr) => (tr.children || [])
      .filter((c) => c.tag === 'td' || c.tag === 'th')
      .map((c) => inline(c.children).replace(/\\\n/g, '<br>').replace(/\s+/g, ' ').trim().replace(/\|/g, '\\|'));
    const header = cellsOf(rows[0]);
    const lines = [
      '| ' + header.join(' | ') + ' |',
      '| ' + header.map(() => '---').join(' | ') + ' |',
    ];
    for (const tr of rows.slice(1)) {
      const cells = cellsOf(tr);
      if (cells.length) lines.push('| ' + cells.join(' | ') + ' |');
    }
    const caption = first(byTag(n, 'caption'));
    const captionText = caption ? oneLine(inline(caption.children)) : '';
    return lines.join('\n') + (captionText ? `\n\n*${captionText}*` : '');
  }

  function inline(nodes) {
    let s = '';
    const list = Array.isArray(nodes) ? nodes : [nodes];
    let afterExotic = false;
    for (const [k, n] of list.entries()) {
      const wasExotic = afterExotic;
      afterExotic = false;
      if (n.tag === '#text') {
        const after = list[k + 1];
        const glued = !!after && after.tag !== 'br' && !(after.tag === '#text' && /^\s/.test(after.text));
        s += escapeMd(n.text.replace(/\s+/g, ' '), inHeading, inLink, glued);
        continue;
      }
      switch (n.tag) {
        // WP: after a bare URL, a space keeps the hard-break backslash out of the autolink.
        // Beside kept HTML, a plain newline: a "\\" there would show on the page.
        case 'br': s += wasExotic ? '\n' : (/(?:https?:\/\/|www\.)[^\s<>"]+$/.test(s) ? ' ' : '') + '\\\n'; break;
        case 'strong': case 'b': s += wrap(inline(n.children), '**', 'strong'); break;
        case 'em': case 'i': s += wrap(inline(n.children), '*', 'em'); break;
        case 'del': case 's': case 'strike': s += wrap(inline(n.children), '~~', 'del'); break;
        case 'sup': case 'sub': {                             // WP: footnote markers, ordinals, formulas
          const t = inline(n.children).trim();
          // A tag in a heading would end up in its anchor id — digits there
          // ("E = mc²", a footnote mark) use the Unicode characters instead.
          const digits = n.tag === 'sup' ? '⁰¹²³⁴⁵⁶⁷⁸⁹' : '₀₁₂₃₄₅₆₇₈₉';
          if (t) s += !inHeading ? `<${n.tag}>${t}</${n.tag}>` : /^\d+$/.test(t) ? [...t].map((d) => digits[d]).join('') : t;
          break;
        }
        case 'code': case 'kbd': case 'samp': {
          const t = rawTextOf(n).replace(/\s+/g, ' ').trim();
          if (t) s += t.includes('`') ? '`` ' + t + ' ``' : '`' + t + '`';
          break;
        }
        case 'a': {
          inLink = true;
          let text;
          try { text = oneLine(inline(n.children)); } finally { inLink = false; }   // WP: link text can't hold a hard break
          const href = attrOf(n, 'href');
          if (!href || href.startsWith('#')) { s += text; break; }
          if (text) s += `[${text}](${mdUrl(ctx.link(href))})`;
          break;
        }
        case 'img': {
          const src = attrOf(n, 'src');
          if (!src) break;
          // WP: alt text is shown verbatim (screen readers, broken images). Markdown
          // would show backslash escapes there, so awkward alts use an <img> tag.
          const alt = collapse(attrOf(n, 'alt'));
          const url = ctx.image(src);
          s += /[[\]\\<>&"]/.test(alt) ? `<img src="${escapeAttr(url)}" alt="${escapeAttr(alt).replace(/>/g, '&gt;')}">` : `![${alt}](${mdUrl(url)})`;
          break;
        }
        default:
          if (EXOTIC_TAGS.has(n.tag)) {
            if (s.endsWith('\\\n')) s = s.slice(0, -2) + '\n';
            // An <iframe>, <form> or <textarea> at a line start opens a raw HTML
            // block in Markdown that swallows the rest of the paragraph — so it
            // gets a block of its own, and the text around it its own paragraphs.
            s += /^(iframe|form|textarea)$/.test(n.tag) ? `\n\n${keepExotic(n)}\n\n` : keepExotic(n);
            afterExotic = true;
          } else if (RAW_TEXT_TAGS.has(n.tag)) { /* scripts/styles never belong in content */ }
          else s += inline(n.children);                       // span, small, time, …
      }
    }
    return s;
    function wrap(text, mark, tag) {
      // Spaces and hard breaks at the edges go outside the markers: "**a\\\n**" is not emphasis.
      const pad = text.match(/^(?:\s|\\\n)*/)[0].includes('\\\n') ? '\\\n' : (/^\s/.test(text) ? ' ' : '');
      const tail = text.match(/(?:\s|\\\n)*$/)[0].includes('\\\n') ? '\\\n' : (/\s$/.test(text) ? ' ' : '');
      const t = text.replace(/^(?:\s|\\\n)+|(?:\s|\\\n)+$/g, '');
      if (!t) return pad || tail;
      if (inHeading) return pad + t + tail;
      // WP: "**word.**next" is not emphasis in Markdown (punctuation next to the
      // marker) — use the HTML tag there, which always works.
      const useTag = /^[\p{P}\p{S}]|[\p{P}\p{S}]$/u.test(t) || t.includes('\\\n');
      return pad + (useTag ? `<${tag}>${t}</${tag}>` : mark + t + mark) + tail;
    }
  }
}

// ---------------------------------------------------------------------------
// 1. Reading the export. WXR is RSS 2.0 plus a "wp:" namespace, written by
// WordPress in the same machine-regular way every time, so no general XML
// parser is needed. All the real content sits in CDATA sections; we stash
// those behind tokens first, so nothing inside a post (even the text
// "</item>") can be mistaken for markup, then pick fields out by exact tag.
// ---------------------------------------------------------------------------

const decodeXml = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (whole, code) => {
  if (code[0] !== '#') return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[code.toLowerCase()];
  const n = /^#x/i.test(code) ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
  return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : whole;
});

/**
 * Parse a WXR export into plain objects.
 * @returns {{site: object, authors: object[], categories: object[], tags: object[], items: object[]} | null}
 *   null when the file is not a WordPress export.
 */
function readWxr(xml) {
  if (!/<rss[\s>]/.test(xml) || !/xmlns:wp=|<wp:wxr_version>/.test(xml)) return null;
  const cdata = [];
  const safe = xml.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, (_m, inner) => `\u0001${cdata.push(inner) - 1}\u0002`);
  // A field's text: CDATA restored verbatim, XML entities decoded elsewhere.
  // (WordPress splits a literal "]]>" into two adjacent CDATA sections; joining
  // the pieces here puts it back together.)
  const text = (s) => s.split(/\u0001(\d+)\u0002/).map((part, i) => (i % 2 ? cdata[Number(part)] : decodeXml(part))).join('').trim();
  const tagRe = (tag) => new RegExp(`<${tag.replace(':', '\\:')}(\\s[^>]*)?>([\\s\\S]*?)</${tag.replace(':', '\\:')}>`, 'g');
  const elements = (block, tag) => [...block.matchAll(tagRe(tag))].map((m) => ({ attrs: parseAttrs(m[1] || ''), inner: m[2] }));
  const field = (block, tag) => { const el = elements(block, tag)[0]; return el ? text(el.inner) : ''; };

  const head = safe.split(/<item[\s>]/)[0];
  const site = {
    title: field(head, 'title'),
    link: field(head, 'link'),
    description: field(head, 'description'),
    language: field(head, 'language'),
    baseSiteUrl: field(head, 'wp:base_site_url'),
    baseBlogUrl: field(head, 'wp:base_blog_url'),
  };
  const authors = elements(head, 'wp:author').map((a) => ({
    login: field(a.inner, 'wp:author_login'),
    name: decodeEntities(field(a.inner, 'wp:author_display_name') || field(a.inner, 'wp:author_login')),
  }));
  const categories = elements(head, 'wp:category').map((c) => ({
    id: field(c.inner, 'wp:term_id'),
    slug: field(c.inner, 'wp:category_nicename'),
    parent: field(c.inner, 'wp:category_parent'),       // the parent's slug, '' at the top
    name: decodeEntities(field(c.inner, 'wp:cat_name')),
  }));
  const tags = elements(head, 'wp:tag').map((t) => ({
    id: field(t.inner, 'wp:term_id'),
    slug: field(t.inner, 'wp:tag_slug'),
    name: decodeEntities(field(t.inner, 'wp:tag_name')),
  }));

  const items = elements(safe, 'item').map(({ inner }) => {
    const comments = elements(inner, 'wp:comment').map((c) => ({
      id: field(c.inner, 'wp:comment_id'),
      parent: field(c.inner, 'wp:comment_parent') || '0',
      author: field(c.inner, 'wp:comment_author'),
      authorUrl: field(c.inner, 'wp:comment_author_url'),
      date: field(c.inner, 'wp:comment_date'),
      content: field(c.inner, 'wp:comment_content'),
      approved: field(c.inner, 'wp:comment_approved'),
      type: field(c.inner, 'wp:comment_type'),
    }));
    const b = inner.replace(tagRe('wp:comment'), '');        // so comment fields never shadow post fields
    // WXR 1.0 (WordPress ≤ 3.0) lists each term twice — once bare, once with a
    // nicename — and calls tags "tag". Keep the nicename'd copies, normalise the domain.
    let terms = elements(b, 'category').map((c) => ({ domain: c.attrs.domain === 'tag' ? 'post_tag' : (c.attrs.domain || 'category'), slug: c.attrs.nicename || '', name: decodeEntities(text(c.inner)) }));
    if (terms.some((t) => t.slug)) terms = terms.filter((t) => t.slug);
    const meta = {};
    for (const m of elements(b, 'wp:postmeta')) meta[field(m.inner, 'wp:meta_key')] = field(m.inner, 'wp:meta_value');
    return {
      id: field(b, 'wp:post_id'),
      type: field(b, 'wp:post_type'),
      status: field(b, 'wp:status'),
      title: decodeEntities(field(b, 'title')),
      link: field(b, 'link'),
      creator: field(b, 'dc:creator'),
      content: field(b, 'content:encoded'),
      excerpt: field(b, 'excerpt:encoded'),
      date: field(b, 'wp:post_date'),
      modified: field(b, 'wp:post_modified'),
      name: field(b, 'wp:post_name'),
      parent: field(b, 'wp:post_parent') || '0',
      menuOrder: Number(field(b, 'wp:menu_order')) || 0,
      password: field(b, 'wp:post_password'),
      attachmentUrl: field(b, 'wp:attachment_url'),
      terms,
      meta,
      comments,
    };
  });
  return { site, authors, categories, tags, items };
}

// ---------------------------------------------------------------------------
// 2. Small helpers: dates, slugs, URLs.
// ---------------------------------------------------------------------------

/** "2024-05-06 10:00:00" → "2024-05-06"; WordPress writes 0000-00-00 for "no date yet". */
function dateOf(...candidates) {
  for (const c of candidates) {
    const d = isoDateOf(c);
    if (d && d !== '0000-00-00') return d;
  }
  return null;
}

/** WordPress percent-encodes non-Latin slugs ("%d0%bf…"); decode before slugifying. */
function decodeSlug(raw) {
  try { return decodeURIComponent(raw); } catch { return raw; }
}

/** Plain text of an HTML snippet (excerpts, SEO descriptions). */
const plainText = (html) => textOf(parseHtml(String(html || '')));

/** Decode a URL path ("%d0%bf" → "п") but keep reserved characters such as %2F encoded. */
function decodePath(p) {
  try { return decodeURI(p); } catch { return p; }
}

/**
 * Lookup key for a URL path: decoded, lowercased, no trailing slash — so
 * /about, /About/ and %-variants all match. (WordPress ignores case in slugs,
 * and macOS/Windows disks would put /About/ and /about/ in the same folder.)
 */
const pathKey = (p) => (decodePath(p).normalize('NFC').toLowerCase().replace(/\/+$/, '') || '/');

/** A redirect key the build can safely turn into dist/<key>/index.html: no ".", "..", "\\" or spaces. */
const isSafeRedirectKey = (p) => !decodePath(p).split('/').some((seg) => seg === '.' || seg === '..' || seg.includes('\\')) && !/\s|%20/i.test(p);

/** Read an export in the encoding its XML declaration names (old sites: ISO-8859-1). */
function readExportFile(file) {
  const buf = fs.readFileSync(file);
  const declared = (buf.subarray(0, 200).toString('latin1').match(/encoding=["']([\w.:-]+)["']/) || [])[1] || 'utf-8';
  let decoder;
  try { decoder = new TextDecoder(declared); } catch { decoder = new TextDecoder('utf-8'); }
  // V8's longest string is ~512 M characters; decoders fail past it in
  // different ways (some say the data is invalid), so check the size first.
  const tooBig = () => {
    const error = new Error(`${file} is too big to read in one piece (${Math.round(buf.length / 1048576)} MB). In WordPress, export in smaller parts (Tools → Export → Posts, with a date range), or run \`wp export --max_file_size=100\` — then pass all the files in one command.`);
    error.userFacing = true;
    return error;
  };
  if (buf.length > 0x1fffffe8) throw tooBig();
  try { return decoder.decode(buf); } catch (e) {
    if (e?.code !== 'ERR_STRING_TOO_LONG' && !(e instanceof RangeError)) throw e;
    throw tooBig();
  }
}

// Addresses plain itself serves at the site root. An imported page there would
// shadow the admin, the API, the blog list or search — and a redirect from
// one of them would hijack it (on GitHub Pages it would even overwrite it).
const RESERVED_PAGE_SLUGS = new Set(['admin', 'api', 'media', 'assets', 'plugins', 'blog', 'search']);
// Files the build writes at fixed addresses — a redirect there would collide with them.
const RESERVED_FILES = new Set(['/', '/blog', '/blog/rss.xml', '/404.html', '/sitemap.xml', '/robots.txt', '/llms.txt', '/search-index.json', '/_redirects', '/favicon.ico']);
const isReservedPath = (p) => { const k = pathKey(p); return RESERVED_FILES.has(k) || /^\/(admin|api|media|assets|plugins|search)(\/|$)/i.test(k); };

// WordPress's default "Uncategorized" category, in the languages it ships in.
// It isn't a topic, so it never becomes a tag.
const DEFAULT_CATEGORY_SLUGS = new Set(['uncategorized', 'uncategorised', 'allgemein', 'non-classe', 'sin-categoria', 'senza-categoria', 'geen-categorie', 'sem-categoria', 'bez-rubriki', 'без-рубрики', 'okategoriserad', 'ukategorisert', 'ikke-kategoriseret', 'nieskategoryzowane', 'bez-kategorii', 'kategorisiz', 'sin-clasificar', 'yleinen', 'nezarazeno', '未分類', '未分类', '미분류']);

// Shortcodes WordPress core and the most common plugins register. Anything
// else in [square brackets] is only treated as a shortcode when it has
// attributes or a closing tag — so ordinary text like "[sic]" survives.
const KNOWN_SHORTCODES = new Set(['addtoany', 'ez-toc', 'caption', 'wp_caption', 'gallery', 'embed', 'audio', 'video', 'playlist', 'code', 'sourcecode', 'contact-form', 'contact-form-7', 'wpforms', 'gravityform', 'ninja_form', 'mc4wp_form', 'woocommerce_cart', 'products', 'product', 'add_to_cart', 'youtube', 'vimeo', 'tweet', 'instagram', 'soundcloud', 'spotify', 'googlemaps', 'toc', 'button', 'su_button', 'row', 'column', 'columns', 'one_half', 'one_third', 'two_thirds', 'one_fourth', 'three_fourths', 'tabs', 'tab', 'accordion', 'toggle', 'divider', 'spacer', 'shortcode']);

// Known names that are also everyday words — "press [tab]", "the [code]" — are
// only shortcodes with attributes or a closing tag.
const BARE_WORDS = new Set(['tab', 'tabs', 'code', 'button', 'toggle', 'row', 'column', 'columns', 'divider', 'spacer', 'product', 'products', 'accordion', 'shortcode', 'toc', 'tweet', 'embed', 'caption']);
// Shortcode prefixes of common plugins and builders. A bare "[su_divider]" on
// its own line is one of theirs; a bare "[web_servers]" (a config snippet) isn't.
const PLUGIN_PREFIX = /^(?:su|et_pb|vc|fusion|av|cs|themify|ux|tm|mk|ts|wpb|cmsms|thb|nectar|bs|bootstrap|sc|woocommerce|jetpack|wpseo|rank_math|bbp|wpforms|mc4wp|gravityform|ninja|ez|elementor|fl|tribe|wpdm|ld|learndash|bp|yoast|wpcf7|give|edd|pmpro|mepr|wpml|tablepress|metaslider|smartslider|rev|layerslider|ultimatemember|um)[_-]/;
const PLUGIN_PREFIX_LAYOUT = /^(?:su|et_pb|vc|fusion|av|cs|themify|ux|tm|mk|ts|wpb|cmsms|thb|nectar|bs|bootstrap|sc)_/;

// Layout shortcodes (any plugin's prefix, any _item/_inner/_last variant):
// what they wrapped were separate blocks.
const isLayoutShortcode = (name) => /^(?:row|rows|col|column|columns|tabs?|accordion|toggle|spoiler|panel|section|container|box|divider|spacer|(?:one|two|three)_(?:half|third|thirds|fourth|fourths|fifth|sixth)|full_width)$/
  .test(name.toLowerCase().replace(PLUGIN_PREFIX_LAYOUT, '').replace(/_(?:item|inner|last|first|wrap|wrapper|title|content)$/, '').replace(/_(?:item|inner|last)$/, ''));

// Page builders leave their layout as shortcodes or private metadata. The text
// still imports; the layout can't, so the review queue says which builder.
const BUILDER_PREFIXES = [['et_pb_', 'Divi'], ['vc_', 'WPBakery'], ['fusion_', 'Avada'], ['av_', 'Enfold'], ['cs_', 'Cornerstone'], ['themify_', 'Themify']];

// ---------------------------------------------------------------------------
// 3. WordPress content → HTML the Markdown converter understands.
// ---------------------------------------------------------------------------

/**
 * A simplified wpautop(): the classic editor stores paragraphs as blank-line
 * separated text and line breaks as bare newlines; WordPress adds the <p> and
 * <br> tags only when it renders. We do the same so paragraphs survive.
 */
function autop(html) {
  const BLOCK_START = /^<\/?(?:p|div|h[1-6]|ul|ol|li|blockquote|pre|table|thead|tbody|tfoot|tr|td|th|figure|figcaption|hr|section|article|aside|header|footer|nav|dl|dt|dd|form|address|iframe|video|audio|object|embed|script|style|details|summary)\b/i;
  // Tags wpautop never puts a <br> beside. (Players and iframes aren't among
  // them: one alone on its line becomes its own block below instead.)
  const BLOCK_EDGE = /<\/?(?:p|table|thead|tbody|tfoot|tr|td|th|caption|colgroup|col|ul|ol|li|dl|dt|dd|div|blockquote|pre|figure|figcaption|h[1-6]|hr|section|article|aside|header|footer|nav|form|address|details|summary)\b[^>]*>/i;
  const endsInBlock = new RegExp(BLOCK_EDGE.source + '$', 'i');
  const startsWithBlock = new RegExp('^' + BLOCK_EDGE.source, 'i');
  /** Turn a chunk's bare newlines into <br>, like wpautop — never inside a tag, after a <br>, or beside a block tag. */
  const breaks = (c) => {
    const lines = c.split('\n');
    return lines.map((line, i) => {
      if (i === lines.length - 1) return line;
      const end = line.trimEnd();
      const insideTag = line.lastIndexOf('<') > line.lastIndexOf('>');
      const quiet = insideTag || /<br\s*\/?>$/i.test(end) || endsInBlock.test(end) || startsWithBlock.test(lines[i + 1].trimStart());
      return line + (quiet ? '\n' : '<br>');
    }).join('');
  };
  // Like wpautop, newlines inside a tag (attributes on several lines) or inside
  // <script>, <style>, <svg>, <math>, <textarea> and <select> are left alone:
  // hide them behind \u0006 until the end.
  const keep = (t) => t.replace(/\n/g, '\u0006');
  return html.replace(/\r\n?/g, '\n')
    .replace(/<(script|style|svg|math|textarea|select)\b[\s\S]*?<\/\1\s*>/gi, keep)
    .replace(/<\/?[a-zA-Z][^<>]*>/g, keep)
    .replace(/\n?(\u0003P\d+\u0003)\n?/g, '\n\n$1\n\n')
    // A player or embed alone on its line sits between lines in WordPress — give it its own block.
    .replace(/^[ \t]*(<(iframe|video|audio|object)\b[^>]*>[\s\S]*?<\/\2>)[ \t]*$/gim, '\n\n$1\n\n')
    .split(/\n[ \t]*\n/).map((chunk) => {
      const c = chunk.trim();
      if (!c) return '';
      if (/^\u0003P\d+\u0003$/.test(c)) return c;                     // stashed <pre>
      // Already a block (<p style>, <div>, a table): keep it, but its line breaks still count.
      if (BLOCK_START.test(c)) return breaks(c);
      return '<p>' + breaks(c) + '</p>';
    }).filter(Boolean).join('\n\n').replace(/\u0006/g, '\n');
}

/** "a=\"1\" b='2' c=3" → {a: '1', b: '2', c: '3'} for shortcode attributes. */
const shortcodeAttrs = (s) => parseAttrs(s || '');

const escapeAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/**
 * Turn one item's WordPress HTML into clean HTML: reusable blocks inlined,
 * shortcodes converted or removed, embeds made into links, classic-editor
 * paragraphs restored. Review notes go through note().
 * @param {string} html
 * @param {{note: (s: string) => void, reusable: (id: string) => string|null, imagesFor: (ids: string[]|null) => {src: string, alt: string}[], footnotes: () => {id: string, content: string}[]}} wp
 */
function normalizeWordPressHtml(html, wp) {
  let s = String(html || '');
  const isClassic = !/<!--\s*wp:/.test(s);

  // Reusable blocks ("synced patterns") are stored once and referenced by id.
  for (let depth = 0; depth < 3 && /<!--\s*wp:block\s/.test(s); depth++) {
    s = s.replace(/<!--\s*wp:block\s+(\{[^}]*\})\s*\/-->/g, (_m, json) => {
      const ref = (json.match(/"ref"\s*:\s*(\d+)/) || [])[1];
      const inner = ref ? wp.reusable(ref) : null;
      if (inner == null) { wp.note(`A reusable block (id ${ref ?? '?'}) wasn't in the export — its content is missing here.`); return ''; }
      return inner;
    });
  }

  // Footnotes (WordPress 6.3+): the text lives in the post's "footnotes" field,
  // the body holds <sup data-fn="…"> markers. Number them and append the notes.
  const notes = wp.footnotes();
  if (notes.length || /<sup\b[^>]*data-fn=/.test(s)) {
    const order = [];
    s = s.replace(/<sup\b[^>]*data-fn="([^"]+)"[^>]*>[\s\S]*?<\/sup>/g, (_m, id) => {
      if (!order.includes(id)) order.push(id);
      return `<sup>${order.indexOf(id) + 1}</sup>`;
    });
    const list = order.map((id) => notes.find((n) => n.id === id)?.content ?? '(footnote text missing from the export)');
    const html = list.length ? `\n\n<hr>\n\n<ol>${list.map((c) => `<li>${c}</li>`).join('')}</ol>\n\n` : '';
    s = /<!--\s*wp:footnotes\b[^>]*?\/-->/.test(s) ? s.replace(/<!--\s*wp:footnotes\b[^>]*?\/-->/, html) : s + html;
  }

  // Dynamic blocks have no stored HTML — WordPress built them on every view.
  const dynamic = new Set();
  for (const m of s.matchAll(/<!--\s*wp:([\w/-]+)[^>]*?\/-->/g)) dynamic.add(m[1]);
  if (dynamic.size) wp.note(`Dynamic block(s) WordPress generated on each page view, so there's nothing to import: ${[...dynamic].join(', ')}. Rebuild by hand if you need them (plain lists posts at /blog/ already).`);

  // Code shortcodes ([code lang="js"]…[/code], [sourcecode language="py"]) → <pre>.
  s = s.replace(/\[(code|sourcecode)\b([^\]]*)\]([\s\S]*?)\[\/\1\]/g, (_m, _name, attrs, code) => {
    const a = shortcodeAttrs(attrs);
    const lang = a.lang || a.language || '';
    return `<pre><code${lang ? ` class="language-${escapeAttr(lang)}"` : ''}>${code.replace(/^\n/, '').replace(/</g, '&lt;')}</code></pre>`;
  });

  // Stash <pre>/<code> so nothing below rewrites what's inside them.
  const stash = [];
  // (A <pre> token counts as a block for autop below; an inline <code> doesn't.)
  s = s.replace(/<(pre|code)\b[\s\S]*?<\/\1>/gi, (m, tag) => `\u0003${tag.toLowerCase() === 'pre' ? 'P' : 'C'}${stash.push(m) - 1}\u0003`);

  // [caption …]<img …> Caption text[/caption] → <figure> with a <figcaption>.
  s = s.replace(/\[(?:wp_)?caption\b([^\]]*)\]([\s\S]*?)\[\/(?:wp_)?caption\]/g, (_m, attrs, inner) => {
    const m = inner.match(/^\s*((?:<a\b[^>]*>\s*)?<img\b[^>]*>(?:\s*<\/a>)?)([\s\S]*)$/i);
    const media = m ? m[1] : inner;
    const caption = (m ? m[2].trim() : '') || shortcodeAttrs(attrs).caption || '';
    return `\n\n<figure>${media}${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>\n\n`;
  });

  // [gallery ids="1,2,3"] → one image per paragraph. No ids = the post's attached images.
  s = s.replace(/\[gallery\b([^\]]*)\]/g, (_m, attrs) => {
    const ids = shortcodeAttrs(attrs).ids;
    const images = wp.imagesFor(ids ? ids.split(',').map((x) => x.trim()).filter(Boolean) : null);
    if (!images.length) { wp.note('A [gallery] had no images the export could resolve — add them by hand.'); return ''; }
    return '\n\n' + images.map((img) => `<p><img src="${escapeAttr(img.src)}" alt="${escapeAttr(img.alt)}"></p>`).join('\n\n') + '\n\n';
  });

  // [embed]URL[/embed] and Gutenberg embed blocks (YouTube, Vimeo, X, …) → a link.
  const embedLink = (url) => {
    let host = url;
    try { host = new URL(url).hostname.replace(/^www\./, ''); } catch { /* keep the raw URL */ }
    wp.note(`An embed (${host}) became a plain link — paste an <iframe> embed code if you want the player back.`);
    return `\n\n<p><a href="${escapeAttr(url)}">${url}</a></p>\n\n`;
  };
  s = s.replace(/\[embed\b[^\]]*\]\s*(https?:\/\/[^\s[]+)\s*\[\/embed\]/g, (_m, url) => embedLink(url));
  s = s.replace(/<figure\b[^>]*\bwp-block-embed\b[^>]*>([\s\S]*?)<\/figure>/g, (whole, inner) => {
    const url = (inner.match(/https?:\/\/[^\s<"]+/) || [])[0];
    if (!url) return whole;
    const caption = ((inner.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/) || [])[1] || '').trim();
    return embedLink(decodeEntities(url)) + (caption ? `<p><em>${caption}</em></p>\n\n` : '');
  });

  // Jetpack embed shortcodes: [youtube URL], [youtube=URL], [vimeo 123456],
  // [tweet URL], [instagram url=…], [soundcloud url="…"] … → a link, like [embed].
  s = s.replace(/\[(youtube|vimeo|tweet|instagram|soundcloud|spotify|googlemaps|dailymotion|ted)\b(=?[^\]]*)\](?:([^[]*)\[\/\1\])?/g, (whole, name, attrs, inner) => {
    const a = shortcodeAttrs(attrs.replace(/^=/, ' '));
    const positional = attrs.replace(/^=/, '').trim().split(/\s+/)[0] || '';
    let url = decodeEntities(a.url || a.src || a.tweet || (/^https?:\/\/|^[\w-]+$|^spotify:/.test(positional) ? positional : '') || (inner || '').trim() || a.id || '').replace(/^["']|["']$/g, '');
    if (name === 'vimeo' && /^\d+$/.test(url)) url = `https://vimeo.com/${url}`;
    if (name === 'tweet' && /^\d+$/.test(url)) url = `https://twitter.com/i/status/${url}`;
    if (name === 'spotify' && /^spotify:(\w+):(\w+)$/.test(url)) url = url.replace(/^spotify:(\w+):(\w+)$/, 'https://open.spotify.com/$1/$2');
    if (name === 'youtube' && /^[\w-]{11}$/.test(url)) url = `https://www.youtube.com/watch?v=${url}`;
    if (name === 'dailymotion' && /^\w+$/.test(url)) url = `https://www.dailymotion.com/video/${url}`;
    if (/^https?:\/\//.test(url)) return embedLink(url);
    if (url) { wp.note(`A [${name}] embed (id "${url}") couldn't be turned into a link — find it on ${name} and link it by hand.`); return ''; }
    return whole;                                           // no address at all: the stripper below notes it
  });

  // Button shortcodes ([su_button url="…"]Buy[/su_button], [button link="…" text="Go"]) → an ordinary link.
  // An enclosing one never reaches past another opening button of the same name.
  const buttonLink = (attrs, inner) => {
    const a = shortcodeAttrs(attrs);
    const href = a.url || a.href || a.link || '';
    return href ? `<a href="${escapeAttr(href)}">${(inner || '').trim() || escapeAttr(a.text || a.label || a.title || href)}</a>` : null;
  };
  s = s.replace(/\[([\w-]*(?:button|btn)[\w-]*)\b([^\]]*)\]((?:(?!\[\1[\s\]])[\s\S])*?)\[\/\1\]/g, (whole, _name, attrs, inner) => buttonLink(attrs, inner) ?? whole);
  s = s.replace(/\[([\w-]*(?:button|btn)[\w-]*)(\s[^\]]*)\]/g, (whole, _name, attrs) => buttonLink(attrs.replace(/\/\s*$/, ''), '') ?? whole);

  // [video]/[audio] → native players (kept as HTML; their files are fetched like images).
  s = s.replace(/\[(video|audio)\b([^\]]*)\](?:\s*\[\/\1\])?/g, (_m, kind, attrs) => {
    const a = shortcodeAttrs(attrs);
    const src = a.src || a.mp4 || a.m4v || a.webm || a.ogv || a.mp3 || a.ogg || a.m4a || a.wav || '';
    if (!src) return '';
    return `\n\n<${kind} controls src="${escapeAttr(src)}"${a.poster ? ` poster="${escapeAttr(a.poster)}"` : ''}></${kind}>\n\n`;
  });

  // Every other shortcode: keep the text it wraps, drop the brackets, and say so.
  const stripped = new Set();
  const builders = new Set();
  const lostUrls = new Set();
  // A shortcode looks like one: real attribute syntax (no spaces around "="),
  // or a closing tag. Prose such as "[sic]", "[n = 120]", "[Smith, 2019]" or
  // "press [tab]" stays — WordPress only ran shortcodes a plugin registered.
  const hasAttrs = (attrs) => /(?:^|\s)[\w-]+=(?:"[^"]*"|'[^']*'|[^\s\]"'])/.test(attrs);
  // Inside a Gutenberg Shortcode block, every [name] is a shortcode — the block says so.
  const declared = new Set();
  for (const m of s.matchAll(/<!--\s*wp:shortcode\s*-->([\s\S]*?)<!--\s*\/wp:shortcode\s*-->/g)) {
    for (const n of m[1].matchAll(/\[\/?([a-zA-Z][\w-]*)/g)) declared.add(n[1]);
  }
  const keptAlone = new Set();
  s = s.replace(/\[(\/?)([a-zA-Z][\w-]*)((?:\s[^\]]*)?)\]/g, (whole, closing, name, attrs, offset, all) => {
    const enclosing = closing || all.includes(`[/${name}]`);
    // A bracket alone on its line ("[toc]", "[divider]") is a shortcode even
    // when its name is an everyday word; inside running prose it isn't.
    const alone = /(?:^|\n|<p\b[^>]*>|<br\s*\/?>)[ \t]*$/i.test(all.slice(Math.max(0, offset - 100), offset))
      && /^[ \t]*(?:$|\n|<\/p>|<br\b)/i.test(all.slice(offset + whole.length, offset + whole.length + 100));
    const bareOk = (KNOWN_SHORTCODES.has(name) && (!BARE_WORDS.has(name) || alone)) || (alone && (PLUGIN_PREFIX.test(name) || isLayoutShortcode(name)));
    const looksReal = declared.has(name) || (!/^[A-Z]/.test(name) && (bareOk || hasAttrs(attrs) || enclosing));
    if (!looksReal) {
      if (alone && /^[a-z][\w-]*$/.test(name)) keptAlone.add(whole);   // maybe a plugin's — say so
      return whole;
    }
    const builder = BUILDER_PREFIXES.find(([prefix]) => name.startsWith(prefix));
    if (builder) builders.add(builder[1]);
    else if (!closing) stripped.add(name);
    for (const m of attrs.matchAll(/https?:\/\/[^\s"'\]]+/g)) lostUrls.add(decodeEntities(m[0]));
    // Columns, tabs and builder sections each become their own paragraph — a
    // paragraph break that holds in block-editor HTML as well as classic text.
    if (builder || isLayoutShortcode(name)) {
      // A tab's label or an FAQ entry's question is visible text — keep it, in bold.
      const a = closing ? {} : shortcodeAttrs(attrs);
      const title = (a.title || a.heading || a.label || a.question || '').trim();
      return title ? `\n\n</p><p><strong>${escapeAttr(title)}</strong></p><p>\n\n` : '\n\n</p><p>\n\n';
    }
    // An enclosing shortcode's text joins its surroundings exactly as WordPress
    // showed it ("[dropcap]L[/dropcap]orem"); a self-closing one between two
    // words leaves a space.
    if (enclosing) return '';
    return /[\p{L}\p{N}]/u.test(all[offset - 1] || '') && /[\p{L}\p{N}]/u.test(all[offset + whole.length] || '') ? ' ' : '';
  });
  if (keptAlone.size) wp.note(`Kept ${[...keptAlone].map((x) => `"${x}"`).join(', ')} as text. If that was a plugin's shortcode rather than words, remove it.`);
  if (builders.size) wp.note(`Built with a page builder (${[...builders].join(', ')}) — the text came across, the layout didn't. Review the page; plain's "landing" layout is a good home for marketing pages.`);
  if (stripped.size) wp.note(`Removed WordPress shortcode(s): ${[...stripped].map((n) => `[${n}]`).join(', ')} — these were plugin features; see "WordPress features → plain" in this report for replacements.${lostUrls.size ? ` They pointed at: ${[...lostUrls].join(', ')}` : ''}`);

  // The classic editor relies on WordPress adding <p> tags at render time, and
  // it turned a URL alone on its own line into an embed. Do both here.
  if (isClassic) {
    s = s.replace(/^[ \t]*(https?:\/\/[^\s<>"]+)[ \t]*$/gm, (_m, url) => embedLink(url).trim());
    s = autop(s);
  }

  return s.replace(/\u0003[PC](\d+)\u0003/g, (_m, i) => stash[Number(i)]);
}

// ---------------------------------------------------------------------------
// 4. Media: which URLs are the site's own uploads, and where they land.
// ---------------------------------------------------------------------------

/** Strip characters and segments that must never reach path.join on disk. */
function safeRel(p) {
  let decoded = p;
  try { decoded = decodeURIComponent(p); } catch { /* keep raw */ }
  return decoded.split(/[/\\]+/).filter((seg) => seg && seg !== '.' && seg !== '..').join('/');
}

/**
 * Where an uploaded file lives under media/, or null if the URL isn't one of
 * the site's files. "…/wp-content/uploads/2024/05/lake.jpg" → "2024/05/lake.jpg",
 * matching the media/YYYY/MM/ folders the plain admin uses. Also understands
 * multisite (uploads/sites/2/…), WordPress.com (name.files.wordpress.com) and
 * the Jetpack image CDN (i0.wp.com/<host>/…).
 * @param {URL} u
 * @param {{isOwnHost: (u: URL) => boolean, wpcomHosts: Set<string>, uploadHosts?: Set<string>, offloadHosts?: Set<string>}} site
 * @returns {{rel: string, uploadsRel: string|null} | null}
 *   rel = path under media/; uploadsRel = path under wp-content/uploads (for --uploads), null if not an upload.
 */
function mediaTarget(u, site) {
  if (/^i[0-3]\.wp\.com$/.test(u.hostname)) {
    try { return mediaTarget(new URL(`https://${u.pathname.slice(1)}`), site); } catch { return null; }
  }
  const isFile = (p) => /\/[^/]+\.[a-z0-9]{2,5}$/i.test(p);   // a folder link is not a file to fetch
  if (u.hostname.endsWith('.files.wordpress.com')) {
    const rel = safeRel(u.pathname);
    if (!isFile(u.pathname) || !site.wpcomHosts.has(u.hostname)) return null;
    return rel ? { rel, uploadsRel: rel } : null;
  }
  // An offload plugin's bucket that the media library points at, with its own
  // path layout ("…/2024/07/fish.jpg"): the YYYY/MM/name tail is the upload.
  if (site.offloadHosts?.has(u.hostname)) {
    if (!isFile(u.pathname)) return null;
    const ym = u.pathname.match(/\/(\d{4}\/\d{2}\/[^/]+)$/);
    const rel = safeRel(ym ? ym[1] : u.pathname);
    return rel ? { rel, uploadsRel: ym ? rel : null } : null;
  }
  const up = u.pathname.indexOf('/wp-content/uploads/');
  // Off-site uploads count only on a host the export's own media library uses (a CDN or media subdomain).
  if (!site.isOwnHost(u) && !(up !== -1 && site.uploadHosts?.has(u.hostname))) return null;
  if (up !== -1) {
    if (!isFile(u.pathname)) return null;
    const uploadsRel = safeRel(u.pathname.slice(up + '/wp-content/uploads/'.length));
    const rel = uploadsRel.replace(/^sites\/\d+\//, '');
    return rel ? { rel, uploadsRel } : null;
  }
  if (/\.(jpe?g|png|gif|webp|avif|svg|ico|pdf|zip|mp[34]|m4[av]|mov|webm|ogg|ogv|wav|docx?|xlsx?|pptx?|epub)$/i.test(u.pathname)) {
    const rel = safeRel(u.pathname);
    return rel ? { rel, uploadsRel: null } : null;
  }
  return null;
}

/** Download one file (two attempts). Returns null on success, else the problem. */
async function download(url, dest) {
  let problem = 'unreachable';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': 'plain-importer/1.0 (+https://github.com/plain-cms/plain)' },
        redirect: 'follow',
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) return `HTTP ${res.status}`;
      // A missing upload often comes back as the site's home or error page with
      // status 200 ("soft 404"). Never save a web page under an image's name.
      if (/^text\/html/i.test(res.headers.get('content-type') || '') && !/\.html?$/i.test(new URL(url).pathname)) {
        return 'the old site sent back a web page instead of the file (probably missing there)';
      }
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      return null;
    } catch (e) {
      problem = e?.cause?.code || e?.code || e?.message || 'network error';
    }
  }
  return String(problem);
}

/** Squeeze runs of blank lines to one — except inside fenced code, where they're part of the code. */
function collapseBlankLines(md) {
  const out = [];
  let fence = null;
  let blank = 0;
  for (const line of md.split('\n')) {
    const f = line.match(/^\s*(`{3,}|~{4,})/);
    if (fence) { out.push(line); if (f && f[1] === fence && !line.trim().slice(fence.length)) fence = null; continue; }
    if (f) fence = f[1];
    if (!line.trim()) { if (++blank > 1) continue; } else blank = 0;
    out.push(line);
  }
  return out.join('\n');
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// 5. The import.
// ---------------------------------------------------------------------------

const POST_LIST_URL = '/blog/';
const postUrl = (slug) => `/blog/${slug}/`;
const pageUrl = (slug) => (slug === 'index' ? '/' : `/${slug}/`);
const tagUrl = (name) => `${POST_LIST_URL}tag/${slugify(name)}/`;

const USAGE = `Usage: node tools/migrate/wordpress.js <export.xml>... [output-dir] [options]

  <export.xml>   In WordPress: Tools → Export → All content → Download Export File.
                 Export split into several files? Pass them all, in one command.
  [output-dir]   Where to write the result (default: ./plain-import)

Options:
  --uploads=DIR  Copy images from a local wp-content/uploads folder (e.g. from a
                 hosting backup) instead of downloading them from the live site
  --no-media     Don't fetch images at all — rewrite their addresses and list
                 the files in the report so you can copy them yourself
  --delay=100    Milliseconds to wait between downloads (raise for slow hosts)`;

async function main() {
  // ---- arguments ------------------------------------------------------------
  const fail = (message) => { console.error(`${message}\n\n${USAGE}`); process.exit(1); };
  const KNOWN_FLAGS = new Set(['uploads', 'no-media', 'delay', 'help', 'h']);
  const flags = {};
  const positional = [];
  const argv = process.argv.slice(2);
  const VALUE_FLAGS = new Set(['uploads', 'delay']);
  for (let i = 0; i < argv.length; i++) {
    const m = argv[i].match(/^--?([\w-]+)(?:=(.*))?$/);
    if (!m) { positional.push(argv[i]); continue; }
    if (!KNOWN_FLAGS.has(m[1])) fail(`Unknown option "${argv[i]}".`);
    let value = m[2];
    if (!VALUE_FLAGS.has(m[1])) {
      if (value !== undefined) fail(`--${m[1]} takes no value — write just --${m[1]}.`);
      flags[m[1]] = true;
      continue;
    }
    if (value === undefined) value = argv[++i];        // "--uploads DIR" works too
    if (!value) fail(`--${m[1]} needs a value, e.g. --${m[1]}=${m[1] === 'uploads' ? '/path/to/wp-content/uploads' : '250'}`);
    flags[m[1]] = value;
  }
  if (flags.help || flags.h) { console.log(USAGE); process.exit(0); }
  if (!positional.length) fail('Which export file? Pass the .xml file WordPress gave you.');

  // Inputs are the export files (a large site's export may be split into
  // several .xml files — pass them all at once). The output folder, if given,
  // is the last argument: it either doesn't exist yet or is a folder.
  let outputArg = null;
  const last = positional[positional.length - 1];
  if (positional.length > 1 && (!fs.existsSync(last) || fs.statSync(last).isDirectory())) outputArg = positional.pop();
  for (const p of positional) {
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) fail(`"${p}" is a folder. Pass the .xml export file(s) inside it, e.g. ${path.join(p, '*.xml')}${positional.length > 1 ? ' — and put the output folder last' : ''}.`);
    if (!fs.existsSync(p)) fail(`Can't find the export file: ${path.resolve(p)}${positional.length > 1 ? '\n(Arguments are read as export files; only the last one can be the output folder.)' : ''}`);
  }
  const inputFiles = positional.map((p) => path.resolve(p));
  const outputDir = path.resolve(outputArg || 'plain-import');
  const uploadsDir = typeof flags.uploads === 'string' ? path.resolve(flags.uploads) : null;
  const noMedia = flags['no-media'] === true;
  const delay = Math.max(0, Number(flags.delay ?? 100) || 0);
  if (uploadsDir && !(fs.existsSync(uploadsDir) && fs.statSync(uploadsDir).isDirectory())) {
    fail(`--uploads folder not found: ${uploadsDir} — point it at the wp-content/uploads folder from your backup.`);
  }

  const parts = [];
  for (const file of inputFiles) {
    const magic = Buffer.alloc(4);
    const fd = fs.openSync(file, 'r');
    try { fs.readSync(fd, magic, 0, 4, 0); } finally { fs.closeSync(fd); }
    if (magic[0] === 0x50 && magic[1] === 0x4b) fail(`${file} is a .zip archive. Unzip it first and pass the .xml file(s) inside (WordPress.com zips can hold several — pass them all).`);
    if (magic[0] === 0x1f && magic[1] === 0x8b) fail(`${file} is compressed (.gz). Decompress it first (gunzip) and pass the .xml file.`);
    let one;
    try { one = readWxr(readExportFile(file)); } catch (e) {
      if (e.userFacing || e.code === 'ERR_FS_FILE_TOO_LARGE') fail(e.userFacing ? e.message : `${file} is too big to read in one piece. In WordPress, export in smaller parts (Tools → Export → Posts, with a date range), or run \`wp export --max_file_size=100\` — then pass all the files in one command.`);
      throw e;
    }
    if (!one) {
      // An existing file in the last place is read as an export, not as the output folder.
      const lastHint = inputFiles.length > 1 && file === inputFiles[inputFiles.length - 1]
        ? `\n(It was the last argument, but it already exists as a file, so it was read as an export. The output must be a folder or a name that doesn't exist yet.)`
        : '';
      fail(`${file} doesn't look like a WordPress export.\nIn WordPress go to Tools → Export, choose "All content", and download the .xml file it gives you.${lastHint}`);
    }
    parts.push({ file, ...one });
  }
  // Split exports are pieces of one site — refuse to blend two different sites.
  const siteOf = (w) => (w.site.baseBlogUrl || w.site.link || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '');
  const otherSite = parts.find((w) => siteOf(w) && siteOf(parts[0]) && siteOf(w) !== siteOf(parts[0]));
  if (otherSite) fail(`These exports come from different sites (${siteOf(parts[0])} and ${siteOf(otherSite)}). Import one site at a time.`);

  // A folder that already holds an import of *other* files would end up with a
  // mix of both and a redirect map from only the last run — stop instead.
  const marker = path.join(outputDir, '.wordpress-import.json');
  const inputNames = inputFiles.map((f) => path.basename(f)).sort();
  if (fs.existsSync(marker)) {
    let previous = [];
    try { previous = JSON.parse(fs.readFileSync(marker, 'utf8')).inputs || []; } catch { /* unreadable: treat as different */ }
    if (JSON.stringify(previous) !== JSON.stringify(inputNames)) {
      fail(`${outputDir} already holds an import of ${previous.join(', ') || 'other files'}. If your export is split into several files, pass them all in one command; otherwise use an empty output folder.`);
    }
  }

  // Merge: one site, every item once (the most recently modified copy wins).
  const uniqueBy = (list, key, prefer = () => false) => {
    const seen = new Map();
    for (const x of list) {
      const k = key(x) || `#${seen.size}`;
      if (!seen.has(k) || prefer(x, seen.get(k))) seen.set(k, x);
    }
    return [...seen.values()];
  };
  const allItems = parts.flatMap((w) => w.items);
  const wxr = {
    site: parts[0].site,
    authors: uniqueBy(parts.flatMap((w) => w.authors), (a) => a.login),
    categories: uniqueBy(parts.flatMap((w) => w.categories), (c) => c.slug),
    tags: uniqueBy(parts.flatMap((w) => w.tags), (t) => t.slug),
    items: uniqueBy(allItems, (i) => i.id, (a, b) => (a.modified || '') > (b.modified || '')),
  };
  const duplicateItems = allItems.length - wxr.items.length;
  try { fs.mkdirSync(outputDir, { recursive: true }); fs.accessSync(outputDir, fs.constants.W_OK); } catch (e) {
    fail(`Can't write to the output folder ${outputDir} (${e.code || e.message}). Pick another folder as the last argument.`);
  }
  fs.writeFileSync(marker, JSON.stringify({ inputs: inputNames }, null, 2) + '\n');
  const progress = (line) => process.stderr.write(line + '\n');

  // ---- the old site's address ---------------------------------------------------
  const siteUrl = (wxr.site.baseBlogUrl || wxr.site.link || wxr.site.baseSiteUrl || 'https://example.invalid').replace(/\/+$/, '');
  let siteHost = '';
  let sitePath = '';
  try { const u = new URL(siteUrl); siteHost = u.hostname.replace(/^www\./, ''); sitePath = u.pathname.replace(/\/+$/, ''); } catch { /* keep defaults */ }
  const isOwnHost = (u) => u.hostname.replace(/^www\./, '') === siteHost;
  // WordPress.com serves uploads from <name>.files.wordpress.com — trust only the hosts this export's own files use.
  const wpcomHosts = new Set(wxr.items.map((i) => { try { return new URL(i.attachmentUrl).hostname; } catch { return ''; } }).filter((h) => h.endsWith('.files.wordpress.com')));
  if (siteHost.endsWith('.wordpress.com')) wpcomHosts.add(`${siteHost.slice(0, -'.wordpress.com'.length)}.files.wordpress.com`);
  // A self-hosted site that moved off WordPress.com may still point at its old
  // <name>.files.wordpress.com address — trusted when the path is one of this export's own uploads.
  // The media library's own addresses: the uploads path of every attachment, and
  // where it lives (an offload plugin or CDN may serve uploads from another host).
  const attachmentSrc = new Map();                      // uploads path → the address the export gives for it
  const uploadHosts = new Set();
  const offloadHosts = new Set();
  for (const i of wxr.items) {
    let u;
    try { u = new URL(i.attachmentUrl); } catch { continue; }
    if (u.hostname.endsWith('.files.wordpress.com')) continue;
    const at = u.pathname.indexOf('/wp-content/uploads/');
    const ym = u.pathname.match(/\/(\d{4}\/\d{2}\/[^/]+)$/);
    const rel = safeRel(at !== -1 ? u.pathname.slice(at + '/wp-content/uploads/'.length) : ym ? ym[1] : '');
    if (rel && !attachmentSrc.has(rel)) attachmentSrc.set(rel, u.origin + u.pathname);
    if (at !== -1) uploadHosts.add(u.hostname);
    else if (!isOwnHost(u)) offloadHosts.add(u.hostname);
  }
  // A site that moved off WordPress.com often still points at its old
  // <name>.files.wordpress.com address. Which one was this site's? The host
  // whose paths match this media library most often; any other is someone else's.
  const wpcomMatches = new Map();
  for (const i of wxr.items) {
    for (const m of String(i.content || '').matchAll(/https?:\/\/([\w-]+\.files\.wordpress\.com)\/(\d{4}\/\d{2}\/[^\s"'?#)<]+)/g)) {
      if (attachmentSrc.has(safeRel(m[2]))) wpcomMatches.set(m[1], (wpcomMatches.get(m[1]) || 0) + 1);
    }
  }
  // Ties go to the host named like this site, then the one used most overall; a dead heat trusts neither.
  const label = (h) => h.split('.')[0];
  const siteWords = `${siteHost} ${slugify(wxr.site.title || '')}`.replace(/[^a-z0-9]/g, '');
  const totalRefs = (h) => wxr.items.reduce((n, i) => n + (String(i.content || '').split(`//${h}/`).length - 1), 0);
  const ranked = [...wpcomMatches.keys()].map((h) => ({ h, score: [wpcomMatches.get(h), siteWords.includes(label(h).replace(/-/g, '')) ? 1 : 0, totalRefs(h)] }))
    .sort((a, b) => b.score[0] - a.score[0] || b.score[1] - a.score[1] || b.score[2] - a.score[2]);
  if (ranked[0] && (!ranked[1] || ranked[0].score.join() !== ranked[1].score.join())) wpcomHosts.add(ranked[0].h);
  const mediaSite = { isOwnHost, wpcomHosts, uploadHosts, offloadHosts };
  const toUrl = (href) => { try { return new URL(href, siteUrl + '/'); } catch { return null; } };

  // ---- sort the export ---------------------------------------------------------
  const byType = (type) => wxr.items.filter((i) => i.type === type);
  const attachments = new Map(byType('attachment').map((a) => [a.id, a]));
  const reusable = new Map(byType('wp_block').map((b) => [b.id, b.content]));
  const IMPORTABLE = new Set(['publish', 'draft', 'pending', 'private', 'future']);
  const skipped = {};                                   // "label" → count, for the report
  const skip = (label) => { skipped[label] = (skipped[label] || 0) + 1; };
  const HANDLED_TYPES = new Set(['post', 'page', 'attachment', 'wp_block', 'nav_menu_item']);
  const THEME_TYPES = new Set(['wp_template', 'wp_template_part', 'wp_global_styles', 'wp_navigation', 'custom_css', 'customize_changeset', 'oembed_cache', 'user_request', 'wp_font_family', 'wp_font_face']);
  for (const item of wxr.items) {
    if (item.type === 'revision') skip('revisions (old versions — plain keeps History from now on)');
    else if (THEME_TYPES.has(item.type)) skip('theme & editor settings (wp_template, custom_css, …)');
    else if (!HANDLED_TYPES.has(item.type)) skip(`"${item.type}" items (a custom post type — see the review queue)`);
  }
  const customTypes = [...new Set(wxr.items.filter((i) => !HANDLED_TYPES.has(i.type) && i.type !== 'revision' && !THEME_TYPES.has(i.type)).map((i) => i.type))];
  const entries = [];                                   // posts + pages we will write
  for (const item of [...byType('post'), ...byType('page')]) {
    // Public = what an anonymous visitor could read. Everything else becomes a draft.
    if (IMPORTABLE.has(item.status)) { item.isPublic = item.status === 'publish' && !item.password; entries.push(item); }
    else skip(item.status === 'trash' ? 'trashed posts/pages' : `${item.status || 'unknown-status'} posts/pages`);
  }

  // ---- review queue --------------------------------------------------------------
  const review = new Map();                             // file → [notes]
  const noteFor = (file) => { if (!review.has(file)) review.set(file, []); return review.get(file); };

  // ---- pass 1: every new URL, and the redirect from every old one ------------------
  const usedPostSlugs = new Set();
  const usedPageSlugs = new Set();
  const byId = new Map();                               // post id → new URL (for ?p=123 links, menus)
  const oldToNew = new Map();                           // pathKey(old path) → new URL (for in-body links)
  const redirects = {};
  const queryRedirects = {};
  const liveUrls = new Set();
  const pagesById = new Map(byType('page').map((p) => [p.id, p]));
  const itemById = new Map(wxr.items.map((i) => [i.id, i]));

  /** The item's old address on this site, decoded ("/2024/05/привет/"), or null if it lived elsewhere. */
  const oldPathOf = (link) => {
    const u = toUrl(link);
    if (!u || !isOwnHost(u)) return null;
    return { path: decodePath(u.pathname).replace(/\s/g, encodeURIComponent), query: u.search };
  };
  // A draft has no slug yet, so its title stands in — capped, so a long title can't make a filename the disk refuses.
  const titleSlug = (t) => { const full = slugify(t); return full.length <= 80 ? full : full.slice(0, 81).replace(/-[^-]*$/, '') || full.slice(0, 80); };
  const baseSlugOf = (item) => slugify(decodeSlug(item.name)) || titleSlug(item.title) || `${item.type}-${item.id}`;
  const isFrontPage = (item, old) => item.type === 'page' && old && !old.query && pathKey(old.path) === pathKey(sitePath || '/');

  // Items whose old address already matches their new one claim their slug
  // first, so a child page can never take a top-level page's URL.
  const keepsUrl = (item) => {
    const old = oldPathOf(item.link);
    if (!old || old.query) return 0;
    const base = baseSlugOf(item);
    return pathKey(old.path) === pathKey(item.type === 'post' ? postUrl(base) : pageUrl(base)) ? 1 : 0;
  };
  // Then public items before drafts, so a draft never pushes a published post to "-2".
  const rank = (item) => keepsUrl(item) * 2 + (item.isPublic ? 1 : 0);
  const allocationOrder = [...entries].sort((a, b) => rank(b) - rank(a));

  for (const item of allocationOrder) {
    const isPost = item.type === 'post';
    const notes = [];
    const old = oldPathOf(item.link);
    // WordPress's "Posts page" is an empty page at /blog/ that WordPress filled
    // with your posts. plain's own blog list lives there — so skip the page and
    // point every link and menu entry that targeted it at the list.
    if (!isPost && old && !old.query && pathKey(old.path) === pathKey(`${sitePath}/blog`) && !plainText(item.content) && !/<(img|iframe|video)\b/i.test(item.content)) {
      item.skip = true;
      byId.set(item.id, POST_LIST_URL);
      oldToNew.set(pathKey(old.path), POST_LIST_URL);
      if (pathKey(old.path) !== pathKey(POST_LIST_URL)) redirects[old.path] = POST_LIST_URL;   // WordPress in a subfolder: /wp/blog/ → /blog/
      noteFor('(not imported)').push(`The empty page "${item.title}" was your WordPress "Posts page". plain lists your posts at /blog/ itself, so it wasn't imported — links and menu entries that pointed at it now go to /blog/.`);
      continue;
    }
    let slug;
    if (isFrontPage(item, old) && !usedPageSlugs.has('index')) {
      slug = 'index';                                   // WordPress gives the static front page the site's own address
    } else {
      const base = baseSlugOf(item);
      slug = base;
      if (item.name && !slugify(decodeSlug(item.name))) notes.push(`WordPress address "${decodeSlug(item.name)}" uses characters plain URLs can't (a–z, 0–9 and "-" only), so it became "${slug}". Rename the file to something readable if you like — then update its entry in data/redirects.json to match.`);
      if (!isPost && RESERVED_PAGE_SLUGS.has(slug)) {
        slug = `${slug}-page`;
        notes.push(`The address "/${base}/" is taken by plain itself (${base === 'blog' ? 'the blog list' : base === 'search' ? 'the search page' : `plain's ${base}`} lives there), so this page moved to "/${slug}/".`);
      }
      if (slug === 'index') slug = `index-${item.type}`;   // index.md is the collection root (/ or /blog/)
      const used = isPost ? usedPostSlugs : usedPageSlugs;
      if (used.has(slug) && !isPost) {
        // Child pages are flattened (/about/team/ → /team/); a second "team" takes its parent's name.
        const parent = pagesById.get(item.parent);
        const parentSlug = parent ? baseSlugOf(parent) : '';
        if (parentSlug && !used.has(`${parentSlug}-${slug}`)) slug = `${parentSlug}-${slug}`;
      }
      for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
    }
    (isPost ? usedPostSlugs : usedPageSlugs).add(slug);
    const url = isPost ? postUrl(slug) : pageUrl(slug);
    item.plain = { slug, url, file: `content/${isPost ? 'posts' : 'pages'}/${slug}.md`, notes };
    byId.set(item.id, url);
    if (item.isPublic) liveUrls.add(url);               // drafts aren't built, so they don't block redirects
    if (old && !old.query) oldToNew.set(pathKey(old.path), url);   // in-body links reach drafts too
    if (item.isPublic && old) {
      if (old.query) queryRedirects[old.path + old.query] = url;
      else if (pathKey(old.path) !== pathKey(url)) redirects[old.path] = url;
    } else if (old && !old.query && pathKey(old.path) !== pathKey(url)) {
      notes.push(`When you publish this, also add \`"${old.path}": "${url}"\` to data/redirects.json so its old address keeps working.`);
    }
  }

  for (let i = entries.length - 1; i >= 0; i--) if (entries[i].skip) entries.splice(i, 1);
  if (duplicateItems) noteFor('(export files)').push(`${duplicateItems} item(s) appeared in more than one export file — kept the most recently modified copy of each.`);

  // ---- tags: every WordPress category and tag becomes a plain tag ---------------------
  // plain gives each tag the address /blog/tag/<slugify(name)>/. Two names that
  // slugify alike ("C++" and "C") or to nothing (non-Latin names) would share
  // or lose a page, so those get a distinguishing label — and the report says so.
  const isTagTerm = (t) => t.domain === 'post_tag' || (t.domain === 'category' && !DEFAULT_CATEGORY_SLUGS.has(decodeSlug(t.slug)));
  const tagLabels = new Map();                          // lowercased name → label
  const labelBySlug = new Map();                        // slugify(label) → label
  const renamedTags = [];
  const labelFor = (name, wpSlug) => {
    const key = name.trim().toLowerCase();
    if (tagLabels.has(key)) return tagLabels.get(key);
    let label = name.trim();
    if (!slugify(label) || labelBySlug.has(slugify(label))) {
      const hint = slugify(decodeSlug(wpSlug || '')) || `tag-${labelBySlug.size + 1}`;
      label = `${name.trim()} (${hint})`;
      for (let n = 2; labelBySlug.has(slugify(label)); n++) label = `${name.trim()} (${hint}-${n})`;
      renamedTags.push(`"${name.trim()}" → "${label}" (address /blog/tag/${slugify(label)}/)`);
    }
    tagLabels.set(key, label);
    labelBySlug.set(slugify(label), label);
    return label;
  };
  // A term whose WordPress address already matches ("C" at /tag/c/) claims its name first.
  const allTerms = [
    ...entries.flatMap((item) => item.terms.filter(isTagTerm)),
    ...wxr.categories.filter((c) => !DEFAULT_CATEGORY_SLUGS.has(decodeSlug(c.slug))),
    ...wxr.tags,
  ];
  const matchesOwnSlug = (t) => (slugify(t.name) && slugify(t.name) === slugify(decodeSlug(t.slug)) ? 1 : 0);
  for (const t of [...allTerms].sort((x, y) => matchesOwnSlug(y) - matchesOwnSlug(x))) labelFor(t.name, t.slug);
  if (renamedTags.length) noteFor('(tags)').push(`Some category/tag names would have shared a tag page (or had no usable address), so they were given a distinguishing label: ${renamedTags.join('; ')}. Rename them in the posts' \`tags:\` if you prefer — and update data/redirects.json to match.`);

  // Taxonomy & archive URLs that existed on the WordPress site.
  const published = entries.filter((e) => e.isPublic);
  const publishedPosts = published.filter((e) => e.type === 'post');
  const tagsInUse = new Set(publishedPosts.flatMap((p) => p.terms.filter(isTagTerm).map((t) => slugify(labelFor(t.name, t.slug)))));
  const tagTarget = (name, wpSlug) => { const label = labelFor(name, wpSlug); return tagsInUse.has(slugify(label)) ? tagUrl(label) : POST_LIST_URL; };
  const liveKeys = new Set([...liveUrls].map(pathKey));
  for (const slug of tagsInUse) liveKeys.add(pathKey(`${POST_LIST_URL}tag/${slug}/`));
  const archiveRedirect = (from, to) => {
    // Slugs come straight from the export: resolve "." / ".." like a browser would.
    let key;
    try { key = decodePath(new URL(sitePath + from, 'https://x.invalid').pathname); } catch { return; }
    if (!isSafeRedirectKey(key) || key in redirects) return;
    if (!oldToNew.has(pathKey(key))) oldToNew.set(pathKey(key), to);   // old links in posts mean the old archive
    if (!liveKeys.has(pathKey(key))) { redirects[key] = to; return; }
    if (pathKey(key) !== pathKey(to)) noteFor('data/redirects.json').push(`The old archive \`${key}\` is now a different plain page, so it can't redirect to \`${to}\` — links inside your posts were pointed at \`${to}\`; old bookmarks will land on the plain page.`);
  };
  if (publishedPosts.length) {
    const catBySlug = new Map(wxr.categories.map((c) => [c.slug, c]));
    const catPath = (c, seen = new Set()) => {
      const parent = c.parent && catBySlug.get(c.parent);
      return parent && !seen.has(parent.slug) ? `${catPath(parent, seen.add(c.slug))}/${c.slug}` : c.slug;
    };
    for (const c of wxr.categories) {
      archiveRedirect(`/category/${catPath(c)}/`, DEFAULT_CATEGORY_SLUGS.has(decodeSlug(c.slug)) ? POST_LIST_URL : tagTarget(c.name, c.slug));
    }
    for (const t of wxr.tags) archiveRedirect(`/tag/${t.slug}/`, tagTarget(t.name, t.slug));
    for (const a of wxr.authors) if (slugify(a.login)) archiveRedirect(`/author/${slugify(a.login)}/`, POST_LIST_URL);
    for (const p of publishedPosts) {
      const d = dateOf(p.date);
      if (d) { archiveRedirect(`/${d.slice(0, 4)}/`, POST_LIST_URL); archiveRedirect(`/${d.slice(0, 4)}/${d.slice(5, 7)}/`, POST_LIST_URL); }
    }
    archiveRedirect('/feed/', `${POST_LIST_URL}rss.xml`);
  }

  // An old address that plain now serves itself can't also redirect away —
  // compared without trailing slashes, since the build writes /x and /x/ to
  // the same place.
  for (const from of Object.keys(redirects)) {
    const to = redirects[from];
    if (pathKey(from) === pathKey(to)) { delete redirects[from]; continue; }
    if (!isSafeRedirectKey(from)) {
      noteFor('data/redirects.json').push(`The old address \`${from}\` can't be a static redirect (it contains spaces or "." segments) — add a rule at your host if it still gets visits (→ \`${to}\`).`);
      delete redirects[from];
      continue;
    }
    if (liveKeys.has(pathKey(from)) || isReservedPath(from)) {
      noteFor('data/redirects.json').push(`The old address \`${from}\` is used by plain itself now, so its redirect to \`${to}\` was dropped.`);
      delete redirects[from];
    }
  }

  // A draft whose address is still a redirect source would be hidden behind
  // the redirect the moment it's published — say so on the draft.
  const draftByKey = new Map(entries.filter((e) => !e.isPublic).map((e) => [pathKey(e.plain.url), e]));
  for (const [from, to] of Object.entries(redirects)) {
    const draft = draftByKey.get(pathKey(from));
    if (draft) draft.plain.notes.push(`data/redirects.json sends \`${from}\` (this page's address) to \`${to}\`. Before you publish this, remove that line — otherwise visitors are redirected away from it.`);
  }

  // Attachment pages (WordPress gives every upload its own page) → the file itself.
  const attachmentByPath = new Map();
  for (const a of attachments.values()) {
    const old = oldPathOf(a.link);
    if (old && !old.query && a.attachmentUrl) attachmentByPath.set(pathKey(old.path), a.attachmentUrl);
  }

  // ---- media bookkeeping ------------------------------------------------------------
  const wanted = new Map();                             // rel → {src, uploadsRel}
  // Two different files must never share a name under media/: not two that
  // differ only in case (macOS and Windows disks treat them as one), and not a
  // multisite subsite's upload and the main site's upload at the same path.
  const ownerOf = new Map();                            // lowercased rel → the source file that has it
  const savedAs = new Map();                            // source file → the rel it was saved under
  const mediaNotes = [];
  // One key per real file: its uploads path, or its path on the site (so http/https/www. are one file).
  const sourceKey = (target) => target.uploadsRel ?? '/' + target.rel;
  // A resized copy ("fish-1024x768.jpg") lives beside its original — on an
  // offloaded site that's the bucket, not the old server the post still names.
  const uploadSrc = (uploadsRel) => {
    if (attachmentSrc.has(uploadsRel)) return attachmentSrc.get(uploadsRel);
    const original = uploadsRel.replace(/-\d+x\d+(?=\.[^./]+$)/, '');
    const found = attachmentSrc.get(original) || attachmentSrc.get(original.replace(/(\.[^./]+)$/, '-scaled$1')) || attachmentSrc.get(original.replace(/(\.[^./]+)$/, '-rotated$1'));
    return found ? found.replace(/[^/]+$/, uploadsRel.split('/').pop()) : null;
  };
  /** Rewrite an upload URL to its /media/ path (and remember to fetch it). Others pass through. */
  const media = (href) => {
    let u = toUrl(href);
    if (!u || !/^https?:$/.test(u.protocol)) return href;
    if (/^i[0-3]\.wp\.com$/.test(u.hostname)) { try { u = new URL(`https://${u.pathname.slice(1)}`); } catch { return href; } }
    const target = mediaTarget(u, mediaSite);
    if (!target) return href;
    // Fetch from where the export says the file lives (not an old WordPress.com
    // copy); ?w=300 resizes fetch the original.
    const src = target.uploadsRel ? uploadSrc(target.uploadsRel) || u.origin + u.pathname : u.href.replace(/#.*$/, '');
    const source = sourceKey(target);
    let rel = savedAs.get(source);
    if (!rel) {
      rel = target.rel;
      const owner = ownerOf.get(rel.toLowerCase());
      if (owner !== undefined && owner !== source) {
        for (let n = 2; ownerOf.has(rel.toLowerCase()); n++) rel = target.rel.replace(/(\.[^./]+)?$/, `-${n}$1`);
        mediaNotes.push(`\`${source}\` and \`${owner}\` would both have been saved as \`media/${target.rel}\` (they differ only in upper/lower case, or come from different sites of a multisite network) — saved \`${source}\` as \`media/${rel}\`.`);
      }
      ownerOf.set(rel.toLowerCase(), source);
      savedAs.set(source, rel);
    }
    if (!wanted.has(rel)) wanted.set(rel, { src, uploadsRel: target.uploadsRel });
    return '/media/' + rel;
  };

  // ---- pass 2: convert and write each post and page ------------------------------------
  const outPosts = path.join(outputDir, 'content', 'posts');
  const outPages = path.join(outputDir, 'content', 'pages');
  fs.mkdirSync(outPosts, { recursive: true });
  fs.mkdirSync(outPages, { recursive: true });
  const authorName = new Map(wxr.authors.map((a) => [a.login, a.name]));
  const multipleAuthors = new Set(entries.map((e) => e.creator).filter(Boolean)).size > 1;
  const counts = { posts: 0, pages: 0, drafts: 0 };
  const comments = {};
  let commentCount = 0;

  const entryById = new Map(entries.map((e) => [e.id, e]));
  const attachmentsByParent = new Map();               // post id → its attached files, in gallery order
  for (const a of attachments.values()) {
    if (!a.attachmentUrl) continue;
    if (!attachmentsByParent.has(a.parent)) attachmentsByParent.set(a.parent, []);
    attachmentsByParent.get(a.parent).push(a);
  }
  for (const list of attachmentsByParent.values()) list.sort((a, b) => a.menuOrder - b.menuOrder);
  const entryByUrl = new Map(entries.map((e) => [e.plain.url, e]));
  const catById = new Map(wxr.categories.map((c) => [c.id, c]));
  const tagBySlug = new Map(wxr.tags.map((t) => [t.slug, t]));

  /**
   * Converter callbacks for one item: links and images rewritten, notes collected.
   * @param {string[]} notes  the item's review notes
   * @param {object|null} item  the post/page being converted (for galleries and footnotes)
   */
  const makeCtx = (notes, item) => {
    const unmapped = new Set();
    const toDrafts = new Set();
    const hotlinked = new Set();
    const resolve = (u, hash) => {
      const q = u.searchParams;
      const id = q.get('p') || q.get('page_id');
      if (id && byId.has(id)) {
        const e = entryById.get(id);                    // undefined for the skipped Posts page
        if (e && !e.isPublic) toDrafts.add(e.plain.file);
        return byId.get(id) + hash;
      }
      if (q.get('attachment_id') && attachments.get(q.get('attachment_id'))?.attachmentUrl) return media(attachments.get(q.get('attachment_id')).attachmentUrl);
      if (q.get('cat') && catById.has(q.get('cat'))) { const c = catById.get(q.get('cat')); return tagTarget(c.name, c.slug); }
      if (q.get('tag') && tagBySlug.has(q.get('tag'))) { const t = tagBySlug.get(q.get('tag')); return tagTarget(t.name, t.slug); }
      if (u.search) return null;                        // ?s=search, unknown ids, …
      const key = pathKey(u.pathname);
      if (oldToNew.has(key)) {
        const target = entryByUrl.get(oldToNew.get(key));
        if (target && !target.isPublic) toDrafts.add(target.plain.file);
        return oldToNew.get(key) + hash;
      }
      if (attachmentByPath.has(key)) return media(attachmentByPath.get(key));
      if (key === pathKey(sitePath || '/')) return '/' + hash;
      return null;
    };
    const ctx = {
      note: (text) => { if (!notes.includes(text)) notes.push(text); },
      image: (src) => {
        const out = media(src);
        // Still on WordPress servers (an old WordPress.com address, another site's uploads)?
        if (out === src && /\.files\.wordpress\.com\/|\/\/i[0-3]\.wp\.com\/|\/wp-content\/uploads\//.test(src)) hotlinked.add(src);
        return out;
      },
      link: (href) => {
        const u = toUrl(href);
        if (!u || !/^https?:$/.test(u.protocol)) return href;              // mailto:, tel:, …
        if (mediaTarget(u, mediaSite)) return media(href);
        if (!isOwnHost(u)) return href;
        const hit = resolve(u, u.hash);
        if (hit) return hit;
        const rel = decodePath(u.pathname) + u.search;
        if (!/^\/wp-(admin|login)/.test(u.pathname.slice(sitePath.length))) unmapped.add(rel);
        return u.pathname + u.search + u.hash;
      },
      finish: () => {
        if (unmapped.size) notes.push(`Links to old address(es) this import has no page for: ${[...unmapped].sort().map((p) => `\`${p}\``).join(', ')} — point them somewhere that exists, or remove them.`);
        if (hotlinked.size) notes.push(`Image(s) still load from another site's WordPress uploads, so they'll break when it goes away: ${[...hotlinked].sort().map((u) => `\`${u}\``).join(', ')} — save them into media/ and update the addresses.`);
        if (toDrafts.size && item?.isPublic) notes.push(`Links to content that is a draft here, so the link won't work until you publish it: ${[...toDrafts].sort().map((f) => `\`${f}\``).join(', ')}.`);
      },
    };
    ctx.wp = {
      note: ctx.note,
      reusable: (id) => (reusable.has(id) ? reusable.get(id) : null),
      imagesFor: (ids) => {
        const list = ids ? ids.map((id) => attachments.get(id)).filter(Boolean)
          : (item && attachmentsByParent.get(item.id)) || [];
        return list.filter((a) => a.attachmentUrl).map((a) => ({ src: a.attachmentUrl, alt: a.meta._wp_attachment_image_alt || '' }));
      },
      footnotes: () => {
        try { const list = JSON.parse(item?.meta?.footnotes || '[]'); return Array.isArray(list) ? list.filter((n) => n && n.id) : []; } catch { return []; }
      },
    };
    return ctx;
  };

  const toMd = (html, ctx) => collapseBlankLines(toMarkdown(parseHtml(normalizeWordPressHtml(html, ctx.wp)), ctx)).trim();

  for (const item of entries) {
    const isPost = item.type === 'post';
    const { slug, url, file, notes } = item.plain;
    const ctx = makeCtx(notes, item);

    const title = item.title.trim() || (slug === 'index' ? 'Home' : slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
    if (!item.title.trim()) notes.push(`Had no title in WordPress — named it "${title}".`);
    item.plain.title = title;                           // menus reuse it
    const body = toMd(item.content, ctx);
    if (!body) notes.push(isPost ? 'This post has no content.' : 'This page has no content. If it was your WordPress "Posts page" (the one that listed your posts), delete it — plain lists posts at /blog/ by itself.');

    const fm = { title };
    if (isPost) {
      const date = dateOf(item.date, item.modified);
      fm.date = date || '1970-01-01';
      if (!date) notes.push('Had no date in WordPress (a never-published draft) — set `date:` before you publish it.');
    }
    const description = plainText(item.meta._yoast_wpseo_metadesc || item.meta.rank_math_description || item.excerpt);
    if (description) fm.description = description;
    const thumb = attachments.get(item.meta._thumbnail_id);
    if (isPost && thumb?.attachmentUrl) fm.cover = ctx.image(thumb.attachmentUrl);
    else if (isPost && item.meta._thumbnail_id) notes.push(`Its featured image (media item ${item.meta._thumbnail_id}) isn't in the export — export "All content", or set \`cover:\` by hand.`);
    if (isPost) {
      const tags = [];
      for (const t of item.terms.filter(isTagTerm)) { const label = labelFor(t.name, t.slug); if (!tags.includes(label)) tags.push(label); }
      if (tags.length) fm.tags = tags;
      if (multipleAuthors && item.creator) fm.author = authorName.get(item.creator) || item.creator;
    }

    // Anything that wasn't public in WordPress stays a draft here.
    const status = item.password ? 'password' : item.status;
    if (status !== 'publish') {
      fm.draft = true;
      counts.drafts += 1;
      if (status === 'private') notes.push('Was **Private** in WordPress (only logged-in editors could see it). plain sites are fully public — publishing it makes it visible to everyone.');
      if (status === 'password') notes.push('Was **password-protected** in WordPress. plain has no passwords — it is a draft until you decide it can be public.');
      if (status === 'future') notes.push(`Was **scheduled** for ${dateOf(item.date) || 'a future date'} in WordPress. plain doesn't schedule — remove \`draft: true\` on that day.`);
    }

    ctx.finish();
    fs.writeFileSync(path.join(outputDir, file), serializeFrontmatter(fm, ['title', 'date', 'description', 'cover', 'tags', 'author', 'draft']) + '\n' + (body ? body + '\n' : ''));
    counts[isPost ? 'posts' : 'pages'] += 1;
    if (notes.length) noteFor(file).push(...notes);

    // Approved comments become a static archive. No e-mail or IP addresses — the repository is public.
    if (item.isPublic) {
      const kept = item.comments.filter((c) => c.approved === '1' && (c.type === '' || c.type === 'comment'));
      if (kept.length) {
        comments[url] = kept.map((c) => {
          const out = { id: Number(c.id) || c.id, parent: Number(c.parent) || 0, author: decodeEntities(c.author), date: c.date };
          try { if (/^https?:$/.test(new URL(c.authorUrl).protocol) && new URL(c.authorUrl).hostname) out.authorUrl = c.authorUrl; } catch { /* "http://" placeholder or junk: leave it out */ }
          out.content = toMd(c.content, makeCtx([], null));
          return out;
        });
        commentCount += kept.length;
      }
    }
  }
  if (customTypes.length) noteFor('(not imported)').push(`Custom content type(s) skipped: ${customTypes.map((t) => `"${t}"`).join(', ')}. If you want them, add a collection to site.config.json for each and ask an AI agent to extend this importer — the items are in your export file.`);

  // ---- navigation: the main menu ------------------------------------------------------
  const menus = new Map();                              // menu name → items
  for (const m of byType('nav_menu_item')) {
    const menu = m.terms.find((t) => t.domain === 'nav_menu');
    if (!menu) continue;
    if (!menus.has(menu.name)) menus.set(menu.name, []);
    menus.get(menu.name).push(m);
  }
  let navigation = null;
  let navMenuName = '';
  if (menus.size) {
    const names = [...menus.keys()];
    navMenuName = names.find((n) => /primary|main|header|top/i.test(n)) || names.sort((a, b) => menus.get(b).length - menus.get(a).length)[0];
    const tagById = new Map(wxr.tags.map((t) => [t.id, t]));
    const navNotes = [];
    const navCtx = makeCtx(navNotes, null);
    navigation = [];
    for (const m of menus.get(navMenuName).filter((x) => (x.meta._menu_item_menu_item_parent || '0') === '0').sort((a, b) => a.menuOrder - b.menuOrder)) {
      const kind = m.meta._menu_item_type;
      const objectId = m.meta._menu_item_object_id;
      let url = null;
      let label = m.title.trim();
      if (kind === 'post_type') {
        url = byId.get(objectId) || null;
        const target = entryById.get(objectId);
        // WordPress leaves a menu label empty unless it was customised — use the
        // page's own title, even for the Posts page that wasn't imported.
        if (!label) label = target?.plain.title || (itemById.get(objectId)?.title || '').trim() || (url === POST_LIST_URL ? 'Blog' : '');
        if (target && !target.isPublic) url = null;
      } else if (kind === 'taxonomy') {
        const term = m.meta._menu_item_object === 'post_tag' ? tagById.get(objectId) : catById.get(objectId);
        if (term) { url = tagTarget(term.name, term.slug); if (!label) label = term.name; }
      } else if (kind === 'post_type_archive') {
        // The "Posts" archive is plain's blog list; other archives (a shop's products) weren't imported.
        url = !m.meta._menu_item_object || m.meta._menu_item_object === 'post' ? POST_LIST_URL : null;
      } else {
        const raw = (m.meta._menu_item_url || '').trim();
        if (!raw || raw === '#' || /^javascript:/i.test(raw)) {
          navNotes.push(`Menu entry ${label ? `"${label}"` : `(untitled, menu item ${m.id})`} was only a drop-down heading (no link of its own) — left out with its drop-down.`);
          continue;
        }
        url = navCtx.link(raw);
      }
      if (!url || !label) { navNotes.push(`Menu entry ${label || m.meta._menu_item_url ? `"${label || m.meta._menu_item_url}"` : `(untitled, menu item ${m.id})`} points at something this import doesn't include — left out.`); continue; }
      navigation.push({ label, url });
    }
    navCtx.finish();
    const nested = menus.get(navMenuName).length - menus.get(navMenuName).filter((x) => (x.meta._menu_item_menu_item_parent || '0') === '0').length;
    if (nested) navNotes.push(`${nested} drop-down (nested) menu entr${nested === 1 ? 'y was' : 'ies were'} left out — plain's menu is one level.`);
    const others = names.filter((n) => n !== navMenuName);
    if (others.length) navNotes.push(`Used the menu "${navMenuName}". Other menus not imported: ${others.map((n) => `"${n}"`).join(', ')}.`);
    if (navNotes.length) noteFor('data/navigation.json').push(...navNotes);
  }

  // ---- fetch the media -------------------------------------------------------------------
  const mediaResult = { fetched: 0, copied: 0, missing: [] };
  const mode = noMedia ? 'none' : uploadsDir ? 'copy' : 'download';
  let n = 0;
  for (const [rel, { src, uploadsRel }] of wanted) {
    n += 1;
    const dest = path.join(outputDir, 'media', rel);
    if (mode === 'none') { mediaResult.missing.push({ rel, src, problem: 'not fetched (--no-media)' }); continue; }
    if (mode === 'copy') {
      const local = uploadsRel ? path.join(uploadsDir, uploadsRel) : null;
      let problem = uploadsRel ? 'not in the --uploads folder' : 'not an upload — fetch it from the old site';
      if (local && fs.existsSync(local) && fs.statSync(local).isFile()) {
        try {
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.copyFileSync(local, dest);
          mediaResult.copied += 1;
          problem = null;
        } catch (e) { problem = `couldn't copy (${e.code || e.message})`; }
      }
      if (problem) mediaResult.missing.push({ rel, src, problem });
      continue;
    }
    progress(`Downloading media ${n}/${wanted.size}: ${rel}`);
    const problem = await download(src, dest);
    if (problem) mediaResult.missing.push({ rel, src, problem });
    else mediaResult.fetched += 1;
    if (delay && n < wanted.size) await sleep(delay);
  }

  if (mediaNotes.length) noteFor('media/').push(...mediaNotes);
  if (!usedPageSlugs.has('index')) noteFor('content/pages/index.md').push('Your WordPress home page listed your latest posts, so no home page was imported. Your plain site keeps its own `content/pages/index.md` — rewrite it as your new home page (a landing page works well), and link to /blog/ for the posts.');

  // ---- write the data files ------------------------------------------------------------------
  fs.mkdirSync(path.join(outputDir, 'data'), { recursive: true });
  const sorted = (obj) => Object.fromEntries(Object.keys(obj).sort().map((k) => [k, obj[k]]));
  fs.writeFileSync(path.join(outputDir, 'data', 'redirects.json'), JSON.stringify(sorted(redirects), null, 2) + '\n');
  if (navigation?.length) fs.writeFileSync(path.join(outputDir, 'data', 'navigation.json'), JSON.stringify(navigation, null, 2) + '\n');
  if (commentCount) fs.writeFileSync(path.join(outputDir, 'data', 'comments.json'), JSON.stringify(sorted(comments), null, 2) + '\n');

  // ---- report ------------------------------------------------------------------------------------
  // Editors insert a resized copy ("lake-1024x768.jpg"); its original counts as used.
  // WordPress names a big upload's original "-scaled" or "-rotated"; compare without either.
  const unscaled = (k) => k.replace(/-(?:scaled|rotated)(?=\.[^./]+$)/, '');
  const usedOriginals = new Set([...savedAs.keys()].map((k) => unscaled(k.replace(/-\d+x\d+(?=\.[^./]+$)/, ''))));
  const report = buildReport({
    inputFiles, outputDir, site: wxr.site, counts, mode, mediaResult, wanted: wanted.size,
    unusedMedia: [...attachments.values()].filter((a) => {
      const u = a.attachmentUrl && toUrl(a.attachmentUrl);
      const target = u && mediaTarget(u, mediaSite);
      return target && !savedAs.has(sourceKey(target)) && !usedOriginals.has(unscaled(sourceKey(target)));
    }).length,
    redirects: sorted(redirects), queryRedirects: sorted(queryRedirects), review, skipped,
    navigation, navMenuName, commentCount, multipleAuthors,
    hasIndex: usedPageSlugs.has('index'),
  });
  fs.writeFileSync(path.join(outputDir, 'MIGRATION-REPORT.md'), report);
  process.stdout.write(report);
}

/** Assemble the human-readable migration report (stdout + MIGRATION-REPORT.md). */
function buildReport(r) {
  const L = [];
  const rel = (p) => path.join(r.outputDir, p);
  L.push('# WordPress → plain migration report', '');
  L.push(`- Export file${r.inputFiles.length > 1 ? 's' : ''}: ${r.inputFiles.map((f) => `\`${f}\``).join(', ')}`);
  if (r.site.title) L.push(`- WordPress site: ${r.site.title}${r.site.link ? ` (${r.site.link})` : ''}`);
  L.push(`- Output: \`${r.outputDir}\``, '');

  L.push('## Converted', '');
  L.push(`- Posts: ${r.counts.posts} → \`content/posts/\``);
  L.push(`- Pages: ${r.counts.pages} → \`content/pages/\`${r.hasIndex ? ' (your WordPress home page is `index.md`)' : ''}`);
  if (r.counts.drafts) L.push(`- Of those, ${r.counts.drafts} are drafts (\`draft: true\`) because they weren't public in WordPress`);
  const m = r.mediaResult;
  if (r.mode === 'download') L.push(`- Media: ${m.fetched} of ${r.wanted} file(s) downloaded → \`media/\``);
  else if (r.mode === 'copy') L.push(`- Media: ${m.copied} of ${r.wanted} file(s) copied from your uploads folder → \`media/\``);
  else L.push(`- Media: ${r.wanted} file(s) referenced, none fetched (\`--no-media\`) — the list is below`);
  if (r.unusedMedia) L.push(`- ${r.unusedMedia} file(s) in your WordPress media library aren't used by any post or page, so they were left behind`);
  L.push(`- Redirects: ${Object.keys(r.redirects).length} → \`data/redirects.json\``);
  if (r.navigation?.length) L.push(`- Menu: ${r.navigation.length} entr${r.navigation.length === 1 ? 'y' : 'ies'} from "${r.navMenuName}" → \`data/navigation.json\``);
  if (r.commentCount) L.push(`- Comments: ${r.commentCount} approved comment(s) archived → \`data/comments.json\` (names and websites only — no e-mail addresses)`);
  if (r.multipleAuthors) L.push('- Posts carry an `author:` field (your site had several authors). To edit it in the admin, add `{ "name": "author", "type": "text" }` to the posts fields in `site.config.json`.');
  L.push('');

  const skippedEntries = Object.entries(r.skipped);
  if (skippedEntries.length) {
    L.push('## Not imported', '');
    for (const [label, count] of skippedEntries) L.push(`- ${count} × ${label}`);
    L.push('');
  }

  if (m.missing.length) {
    L.push('## Media to fetch by hand', '');
    L.push('Content already points at these `/media/…` paths; put each file there (or fix the reference).', '');
    for (const f of m.missing) L.push(`- \`media/${f.rel}\` ← ${f.src} — ${f.problem}`);
    L.push('');
  }

  L.push('## Redirects (old WordPress URL → new plain URL)', '');
  const redirectList = Object.entries(r.redirects);
  if (!redirectList.length) L.push('_None — every URL is unchanged._', '');
  else { for (const [from, to] of redirectList) L.push(`- \`${from}\` → \`${to}\``); L.push(''); }

  const query = Object.entries(r.queryRedirects);
  if (query.length) {
    L.push('## Query-string URLs (need host-level rules)', '');
    L.push('Your WordPress site used "plain" permalinks (`/?p=123`). A static redirect file cannot match query strings; if these still get traffic, add rules at your host (Cloudflare Bulk Redirects, or Netlify `_redirects` query matching).', '');
    for (const [from, to] of query) L.push(`- \`${from}\` → \`${to}\``);
    L.push('');
  }

  L.push('## Review queue', '');
  L.push('_Things the importer could not convert with full confidence. Each is a ready-to-run task for you or an AI agent._', '');
  if (!r.review.size) L.push('_Empty — everything converted cleanly._', '');
  else for (const [file, notes] of r.review) { L.push(`### \`${file}\``); for (const note of notes) L.push(`- ${note}`); L.push(''); }

  L.push('## WordPress features → plain', '');
  L.push('WordPress runs code on a server for every visit; plain publishes static files. Here is where each piece goes:', '');
  L.push('| WordPress | plain |');
  L.push('| --- | --- |');
  L.push('| Categories & tags | Merged into each post’s `tags` list; plain builds a page per tag at `/blog/tag/<name>/` |');
  L.push('| Contact Form 7, WPForms, Gravity Forms | `contact-form` plugin (Formspree or your own endpoint), or `api-form` for your own backend |');
  L.push('| Comments | Old ones archived in `data/comments.json`; for new ones, a comments plugin such as giscus |');
  L.push('| Search | Built-in `search` plugin |');
  L.push('| Yoast / Rank Math SEO | Built in: sitemap, canonical and social tags from each post’s `description` and `cover`; `structured-data` plugin for Schema.org |');
  L.push('| RSS feed | Built in at `/blog/rss.xml` (`/feed/` redirects there) |');
  L.push('| Jetpack Stats, Google Analytics | `goatcounter` plugin |');
  L.push('| Widgets & sidebars | Not in the export — move what matters into a page or the footer (admin → Settings) |');
  L.push('| Page builders (Elementor, Divi, …) | Text imports, layout doesn’t — the `landing` page layout covers hero + sections |');
  L.push('| Users & logins, memberships, WooCommerce | Out of scope for a static site — use a dedicated service |');
  L.push('');

  L.push('## Next step', '');
  L.push('Keep the posts collection at its default `"urlPattern": "/blog/:slug/"` — the links inside your posts already point there.', '');
  L.push('Copy the results into your plain repository, then build:', '');
  L.push('```sh');
  L.push(`cp -R "${rel('content')}/." content/`);
  L.push(`cp -R "${rel('media')}/." media/            # if media/ was created`);
  L.push(`cp "${rel('data/redirects.json')}" data/redirects.json   # or merge, if you already have redirects`);
  if (r.navigation?.length) L.push(`cp "${rel('data/navigation.json')}" data/navigation.json # review it first`);
  if (r.commentCount) L.push(`cp "${rel('data/comments.json')}" data/comments.json     # optional: the comment archive`);
  L.push('node build.js');
  L.push('```', '');
  return L.join('\n');
}

await main();
