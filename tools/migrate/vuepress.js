#!/usr/bin/env node
// tools/migrate/vuepress.js — import a VuePress site into plain (cms-spec.md §15).
//
//   node tools/migrate/vuepress.js <src-dir> [output-dir] [--collections=a,b]
//        [--component=Name=replacement …] [--base=/subpath/]
//
// VuePress content is already Markdown + frontmatter in Git, so this is a pure
// file transform: flatten the folder tree into plain collections, remap
// frontmatter (one level of nesting becomes flat keys), convert or strip Vue
// components and ::: containers, copy .vuepress/public/, and — non-negotiably
// (§15) — emit a complete old→new redirect map so URLs never silently change.
// It writes into ./plain-import/ by default so it can never clobber the user's
// working tree. Dependency-free on purpose: only node:fs and node:path.
//
//   <src-dir>               the folder that contains .vuepress/ (mysite/src,
//                           mysite/docs); the importer probes both if you
//                           pass the repo root
//   --collections=a,b       top-level folders to import as collections.
//                           Default: every top-level folder holding two or
//                           more non-README .md files. The flag replaces the
//                           automatic list.
//   --component=Name=text   replace every <Name …/> with `text`. Repeatable.
//                           An empty replacement (--component=Name=) strips
//                           the component silently; unmapped components are
//                           stripped with a review note.
//   --base=/subpath/        the VuePress `base`, if it is not declared in
//                           .vuepress/config.{ts,js,mjs}
//
// Deliberate divergence from jekyll.js: slug collisions never overwrite.
// Flattening subfolders into slugs makes collisions likely rather than an
// edge case, so the later file gets a -2/-3… suffix and the review queue
// names both sources.

import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------
// A deliberately tiny YAML reader for the subset VuePress frontmatter uses in
// practice: "key: value" scalars, "key: [inline, list]", "key:" followed by
// indented "- item" lines, and — one step beyond jekyll.js — "key:" followed
// by indented "sub: value" scalars (a one-level nested object, common for
// `author:`). Maps nested inside list items (theme-hope `actions:`) and
// anything deeper than one level are skipped rather than guessed at.
// ---------------------------------------------------------------------------

/** Parse one scalar: quoted strings, booleans, null, numbers, else bare text. */
// mirrors tools/migrate/jekyll.js — keep in sync
function parseScalar(raw) {
  const s = String(raw).trim();
  if (s === '') return '';
  const q = s.match(/^"(.*)"$/) || s.match(/^'(.*)'$/);
  if (q) return q[1];
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s === 'null' || s === '~') return null;
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s);
  return s;
}

/** Parse a frontmatter block (the text between the "---" fences) into an object. */
// extends tools/migrate/jekyll.js parseYaml with one-level nested objects
function parseYaml(text) {
  const data = {};
  let listKey = null;   // "key:" opened; indented "- item" lines belong to it
  let objKey = null;    // "key:" opened; indented "sub: value" lines belong to it
  let subIndent = -1;   // indent of the first nested "sub:" line — deeper is skipped
  for (const line of text.split(/\r?\n/)) {
    if (line.trim() === '') { listKey = null; objKey = null; continue; }
    if (/^\s*#/.test(line)) continue;                       // whole-line comment
    const item = line.match(/^\s*-\s+(.*)$/) || line.match(/^\s*-\s*$/);
    if (item && listKey) {
      if (!Array.isArray(data[listKey])) data[listKey] = [];
      data[listKey].push(parseScalar(item[1] ?? ''));
      objKey = null;    // now inside a list — nested map lines below items are skipped
      continue;
    }
    const nested = line.match(/^(\s+)([A-Za-z][\w-]*):(.*)$/);
    if (nested) {
      if (!objKey) continue;                                // map inside a list item — skip safely
      if (subIndent === -1) subIndent = nested[1].length;
      if (nested[1].length !== subIndent) continue;         // deeper than one level — skip
      const rest = nested[3].trim();
      if (rest === '') continue;                            // a sub-key opening its own nest — skip
      if (Array.isArray(data[objKey]) && data[objKey].length === 0) data[objKey] = {};
      if (!Array.isArray(data[objKey])) data[objKey][nested[2]] = parseScalar(rest);
      continue;
    }
    const pair = line.match(/^([^:\s][^:]*):(.*)$/);         // top-level "key: …" only
    if (!pair) continue;
    const key = pair[1].trim();
    const rest = pair[2].trim();
    if (rest === '') { data[key] = []; listKey = key; objKey = key; subIndent = -1; continue; }
    listKey = null; objKey = null;
    if (rest.startsWith('[') && rest.endsWith(']')) {
      data[key] = rest.slice(1, -1).split(',').map((s) => parseScalar(s)).filter((v) => v !== '');
    } else {
      data[key] = parseScalar(rest);
    }
  }
  return data;
}

/** Split a source file into {data, body}. data is null when there is no frontmatter. */
// mirrors tools/migrate/jekyll.js — keep in sync
function splitFrontmatter(source) {
  const src = source.replace(/^﻿/, '');
  const lines = src.split(/\r?\n/);
  if (lines[0]?.trim() !== '---') return { data: null, body: src };
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') { end = i; break; }
  }
  if (end === -1) return { data: null, body: src };
  return { data: parseYaml(lines.slice(1, end).join('\n')), body: lines.slice(end + 1).join('\n') };
}

// ---------------------------------------------------------------------------
// Serialize back into plain's frontmatter subset. This mirrors plain's own
// hand-rolled parser (lib/content.js): "key: value", "key:" + indented
// "- item" lists, quotes forcing a string. We wrap values in bare double
// quotes (never JSON escapes) because plain's parser strips a single greedy
// pair of surrounding quotes — so quoted values round-trip even with inner
// quotes, while "\"" escapes would not.
// ---------------------------------------------------------------------------

/** True when a string must be quoted to survive plain's round-trip parse. */
// mirrors tools/migrate/jekyll.js — keep in sync
function needsQuotes(v) {
  return v === ''
    || /^(true|false)$/.test(v)
    || /^-?\d+(\.\d+)?$/.test(v)
    || /^["']/.test(v)
    || /^\s|\s$/.test(v)
    || /^-\s/.test(v);
}

/** Format a single scalar for a frontmatter line, quoting only when required. */
// mirrors tools/migrate/jekyll.js — keep in sync
function fmScalar(value) {
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'number') return String(value);
  const s = String(value).replace(/\r?\n+/g, ' ').trim();   // frontmatter is single-line
  return needsQuotes(s) ? `"${s}"` : s;
}

/** Serialize {data} into a frontmatter block ending in a "---" line + newline. */
// mirrors tools/migrate/jekyll.js — keep in sync
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
// mirrors tools/migrate/jekyll.js — keep in sync
function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---------------------------------------------------------------------------
// Frontmatter mapping: chrome keys are theme layout knobs plain has no use
// for; nested objects flatten into plain's flat key space; the rest maps like
// jekyll.js does.
// ---------------------------------------------------------------------------

// VuePress / theme-hope presentation chrome — dropped silently, except `home`,
// which marks a hero page whose visual content the user must rebuild.
const VUEPRESS_CHROME = new Set([
  'home', 'heroText', 'heroImage', 'heroFullScreen', 'bgImage', 'bgImageStyle',
  'tagline', 'actions', 'features', 'layout', 'icon', 'sidebar', 'sidebarDepth',
  'prev', 'next', 'order', 'index', 'article', 'dir', 'navbar', 'footer',
  'copyright', 'breadcrumb', 'breadcrumbExclude', 'pageInfo', 'editLink',
  'lastUpdated', 'contributors', 'comment', 'toc', 'headerDepth', 'head',
  'containerClass', 'highlights', 'externalLinkIcon', 'sitemap', 'seo', 'feed',
  'pageview',
]);

// Frontmatter keys the importer maps explicitly (chrome is dropped earlier).
const HANDLED = new Set([
  'title', 'date', 'description', 'excerpt', 'tags', 'tag', 'category',
  'categories', 'cover', 'image', 'banner', 'publish', 'draft', 'permalink',
]);

// The field order plain's admin expects at the top of a file.
const ORDER = ['title', 'date', 'description', 'cover', 'author', 'authorUrl', 'section', 'tags', 'draft'];

/** Drop VuePress chrome keys; a `home: true` hero page earns a rebuilding note. */
function dropChrome(data, notes) {
  if (data.home === true) {
    const dropped = [];
    for (const key of ['heroText', 'tagline', 'actions', 'features']) {
      if (data[key] === undefined) continue;
      dropped.push(`${key}=${Array.isArray(data[key]) ? `[${data[key].join('; ')}]` : data[key]}`);
    }
    notes.push(`page used the VuePress hero layout — rebuild the hero in Markdown/HTML; dropped: ${dropped.join(', ') || '(hero fields were empty)'}`);
  }
  for (const key of VUEPRESS_CHROME) delete data[key];
}

/** "avatar_url" → "AvatarUrl": capitalize the first letter, camel-case separators. */
function pascalCase(text) {
  return String(text).replace(/[-_ ]+(\w)/g, (_m, c) => c.toUpperCase()).replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Flatten one-level nested objects into plain's flat frontmatter:
 * {author: {name, url}} → author (the "name" child claims the bare parent
 * key) + authorUrl (parent + PascalCase(child)). A collision keeps the
 * existing key; anything unflattenable is dropped — both with a note.
 */
function flattenFrontmatter(data, notes) {
  for (const [parent, value] of Object.entries(data)) {
    if (value === null || Array.isArray(value) || typeof value !== 'object') continue;
    delete data[parent];
    for (const [child, sub] of Object.entries(value)) {
      if (sub !== null && typeof sub === 'object') {
        notes.push(`Dropped "${parent}.${child}" — nested deeper than plain's flat frontmatter allows; re-add it by hand if it matters.`);
        continue;
      }
      const key = child === 'name' ? parent : parent + pascalCase(child);
      if (key in data) {
        notes.push(`Kept the existing "${key}" — flattening "${parent}.${child}" would have overwritten it.`);
        continue;
      }
      data[key] = sub;
    }
  }
}

/** Collect the merged, de-duplicated tag list from categories + tags keys. */
// mirrors tools/migrate/jekyll.js — keep in sync
function collectTags(data) {
  const out = [];
  const push = (v) => {
    if (v == null || v === '') return;
    for (const t of Array.isArray(v) ? v : String(v).split(/\s+/)) {
      const tag = String(t).trim();
      if (tag && !out.includes(tag)) out.push(tag);
    }
  };
  push(data.categories); push(data.category); push(data.tags); push(data.tag);
  return out;
}

/** Pass through any remaining simple scalar keys that plain can store safely. */
// mirrors tools/migrate/jekyll.js — keep in sync (HANDLED lists VuePress's mapped keys)
function passthrough(data, fm) {
  for (const [key, value] of Object.entries(data)) {
    if (HANDLED.has(key)) continue;
    if (!/^[A-Za-z][\w-]*$/.test(key)) continue;              // plain's key grammar
    if (Array.isArray(value) || value === null || typeof value === 'object') continue;
    if (key in fm) continue;
    fm[key] = value;
  }
}

/** Pull an ISO date (YYYY-MM-DD) out of a frontmatter date value, or null. */
// mirrors tools/migrate/jekyll.js — keep in sync
function isoDateOf(value) {
  const m = value == null ? null : String(value).match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

// ---------------------------------------------------------------------------
// Body conversion: Vue components and ::: containers → Markdown. Fenced code
// blocks and inline code spans are stashed behind VPX tokens first, so a
// literal <Component /> in a code sample survives untouched (the same trick
// as jekyll.js's Liquid stash).
// ---------------------------------------------------------------------------

/** Stash fenced code blocks and inline code spans behind VPX tokens. */
function stashFences(body) {
  const stash = [];
  const keep = (text) => { stash.push(text); return ` VPX${stash.length - 1} `; };
  body = body.replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?\n\1[ \t]*$/gm, keep);
  body = body.replace(/`[^`\n]+`/g, keep);
  return { body, stash };
}

/** Put the stashed code back, byte for byte. */
function restoreFences(body, stash) {
  return body.replace(/ VPX(\d+) /g, (_m, i) => stash[Number(i)]);
}

/**
 * Replace or strip PascalCase Vue components: <Name …/> and <Name …>…</Name>.
 * `replacements` maps component name → substitute text ('' strips silently).
 * Unmapped components are stripped; a paired one whose inner content is lost
 * earns a review note. Occurrences are counted for the report table.
 * @returns {{body: string, counts: Map<string, number>, notes: string[]}}
 */
function convertComponents(body, replacements) {
  const counts = new Map();
  const notes = [];
  const noted = new Set();
  const substitute = (name, inner) => {
    counts.set(name, (counts.get(name) || 0) + 1);
    if (replacements.has(name)) return replacements.get(name);
    if (inner.trim() && !noted.has(name)) {
      noted.add(name);
      notes.push(`Stripping <${name}> swallowed its inner content — recover it from the source file if it mattered.`);
    }
    return '';
  };
  body = body.replace(/<([A-Z][A-Za-z0-9]*)\b[^>]*\/>/g, (_m, name) => substitute(name, ''));
  body = body.replace(/<([A-Z][A-Za-z0-9]*)\b[^>]*>([\s\S]*?)<\/\1>/g, (_m, name, inner) => substitute(name, inner));
  return { body, counts, notes };
}

const CALLOUT_KINDS = new Set(['tip', 'warning', 'danger', 'info', 'note', 'important', 'caution']);

/**
 * Convert VuePress ::: containers into Markdown the build understands:
 * callout kinds become blockquotes with a bold "Kind: Title" lead line,
 * ::: details becomes <details><summary>, and unknown kinds lose their
 * fences but keep their content (kind names go to the review queue).
 * Handles one nesting level, innermost first; anything deeper is noted.
 * @returns {{body: string, unknown: string[], deeper: boolean}}
 */
function convertContainers(body) {
  const unknown = new Set();
  // Innermost only: the tempered body group refuses to cross another ::: line.
  const re = /^:::[^\S\n]*([A-Za-z][\w-]*)([^\n]*)\n((?:(?!^:::)[\s\S])*?)\n:::[^\S\n]*$/gm;
  const convert = (text) => text.replace(re, (_m, kind, title, inner) => {
    kind = kind.toLowerCase();
    title = title.trim();
    if (kind === 'details') return `<details><summary>${title || 'Details'}</summary>\n\n${inner.trim()}\n\n</details>`;
    if (!CALLOUT_KINDS.has(kind)) { unknown.add(kind); return inner.trim(); }
    const label = kind.charAt(0).toUpperCase() + kind.slice(1);
    const quoted = inner.trim().split('\n').map((l) => (l.trim() ? `> ${l}` : '>')).join('\n');
    return `> **${label}${title ? `: ${title}` : ''}**\n${quoted}`;
  });
  body = convert(convert(body));                            // two passes = one nesting level
  return { body, unknown: [...unknown].sort(), deeper: /^:::/m.test(body) };
}

// ---------------------------------------------------------------------------
// Assets: .vuepress/public/** is copied wholesale to media/public/, and every
// root-absolute reference to a file that really exists there is rewritten.
// Membership is checked against the actual file list, so page links
// ("/jobs/") and external URLs are never touched.
// ---------------------------------------------------------------------------

/** Walk .vuepress/public and return the set of relative posix paths inside it. */
function buildPublicIndex(publicDir) {
  const files = new Set();
  const walk = (dir, prefix) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(path.join(dir, entry.name), rel);
      else if (entry.isFile()) files.add(rel);
    }
  };
  if (fs.existsSync(publicDir)) walk(publicDir, '');
  return files;
}

/** "/logo.svg?v=2" → "logo.svg" when that file exists in public/, else null. */
function publicPathOf(ref, publicFiles) {
  let p = String(ref).replace(/^\//, '').replace(/[?#].*$/, '');
  try { p = decodeURI(p); } catch { /* malformed escape — check as written */ }
  return publicFiles.has(p) ? p : null;
}

/** Rewrite root-absolute refs to public/ files (Markdown links, src/href, CSS url()). */
function rewritePublicRefs(body, publicFiles) {
  const sub = (pre, ref) => (publicPathOf(ref, publicFiles) === null ? `${pre}/${ref}` : `${pre}/media/public/${ref}`);
  return body
    .replace(/(\]\()\/([^)\s]+)/g, (_m, pre, ref) => sub(pre, ref))
    .replace(/((?:src|href)\s*=\s*["'])\/([^"'>\s]+)/g, (_m, pre, ref) => sub(pre, ref))
    .replace(/(url\(\s*['"]?)\/([^"')\s]+)/g, (_m, pre, ref) => sub(pre, ref));
}

/** Rewrite a bare asset value (a `cover:` field) to media/ when it is a public/ file. */
function rewriteBareAsset(value, publicFiles) {
  const p = publicPathOf(String(value), publicFiles);
  return p === null ? String(value) : `/media/public/${String(value).replace(/^\//, '')}`;
}

/** Run the full body pipeline; the order matters (code must be stashed first). */
function convertBody(rawBody, replacements, publicFiles) {
  const { body: stashed, stash } = stashFences(rawBody);
  const comp = convertComponents(stashed, replacements);
  const cont = convertContainers(comp.body);
  let body = restoreFences(cont.body, stash);
  body = rewritePublicRefs(body, publicFiles);
  body = body.replace(/\n{3,}/g, '\n\n').trim();
  return { body, counts: comp.counts, notes: comp.notes, unknown: cont.unknown, deeper: cont.deeper };
}

// ---------------------------------------------------------------------------
// Old URLs (for redirects). VuePress URLs are the file paths themselves, with
// the ORIGINAL casing — README.md is its folder's index, everything else is
// <folder>/<File>.html — prefixed by the site's `base` subpath.
// ---------------------------------------------------------------------------

/** Read the VuePress `base` (subpath) from --base or .vuepress/config.*, default "/". */
function readBase(vuepressDir, flag) {
  let base = typeof flag === 'string' ? flag : null;
  if (!base) {
    for (const name of ['config.ts', 'config.js', 'config.mjs']) {
      const m = (readIfExists(path.join(vuepressDir, name)) || '').match(/base:\s*["']([^"']+)/);
      if (m) { base = m[1]; break; }
    }
  }
  base = base || '/';
  if (!base.startsWith('/')) base = '/' + base;
  if (!base.endsWith('/')) base += '/';
  return base;
}

/** The URL a source file had on the VuePress site; an explicit permalink wins.
    Both forms live under the site's `base` subpath, like VuePress serves them. */
function oldUrlFor(relPath, permalink, base) {
  if (typeof permalink === 'string' && permalink.trim()) return encodeURI(base + permalink.trim().replace(/^\/+/, ''));
  const dir = path.posix.dirname(relPath);
  const prefix = base + (dir === '.' ? '' : dir + '/');
  const name = path.posix.basename(relPath, '.md');
  return encodeURI(/^(readme|index)$/i.test(name) ? prefix : `${prefix}${name}.html`);
}

// ---------------------------------------------------------------------------
// Navigation: a best-effort regex read of .vuepress/navbar.ts — bare string
// entries, {text, link} pairs, and {text, prefix, children} dropdowns
// (flattened). Not a TypeScript parser; the report says to review the result.
// ---------------------------------------------------------------------------

/** Extract [{label, url}] from a navbar module's text, translating old URLs. */
function parseNavbar(text, urlMap, base = '/') {
  const entries = [];
  const resolve = (url) => {
    const candidates = [url, `${url}.html`, url.endsWith('/') ? url.slice(0, -1) : `${url}/`];
    // navbar links are written base-relative; the URL map keys include the base
    if (base !== '/') for (const c of candidates.slice()) candidates.push(base + c.replace(/^\/+/, ''));
    for (const c of candidates) {
      if (urlMap[c]) return urlMap[c];
    }
    return url;
  };
  const labelOf = (link) => {
    const last = link.replace(/\/+$/, '').split('/').pop() || '';
    if (!last) return 'Home';
    return last.replace(/\.(html|md)$/i, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };
  // One ordered scan: object literals (dropdowns nest {text, link} children
  // one level deep, so the pattern allows a single level of inner braces), or
  // a bare string on its own line.
  for (const m of text.matchAll(/\{(?:[^{}]|\{[^{}]*\})*\}|^[ \t]*["']([^"']*)["'],?[ \t]*$/gm)) {
    if (m[1] !== undefined) {
      if (m[1].startsWith('/')) entries.push({ label: labelOf(m[1]), url: resolve(m[1]) });
      continue;
    }
    const literal = m[0];
    const prefixM = literal.match(/prefix:\s*["']([^"']+)["']/);
    const childrenM = literal.match(/children:\s*\[([\s\S]*)\]/);
    if (prefixM && childrenM) {
      // Children are bare strings ("May-2026/") or {text, link} objects;
      // relative links resolve against the dropdown's prefix.
      const withPrefix = (link) => (link.startsWith('/') ? link : prefixM[1].replace(/\/*$/, '/') + link);
      for (const child of childrenM[1].match(/\{[^{}]*\}/g) || []) {
        const textM = child.match(/text:\s*["']([^"']+)["']/);
        const linkM = child.match(/link:\s*["']([^"']+)["']/);
        if (linkM) entries.push({ label: textM ? textM[1] : labelOf(linkM[1]), url: resolve(withPrefix(linkM[1])) });
      }
      for (const quoted of childrenM[1].replace(/\{[^{}]*\}/g, '').match(/["']([^"']+)["']/g) || []) {
        const child = quoted.slice(1, -1);
        entries.push({ label: labelOf(child), url: resolve(withPrefix(child)) });
      }
    } else {
      const textM = literal.match(/text:\s*["']([^"']+)["']/);
      const linkM = literal.match(/link:\s*["']([^"']+)["']/);
      if (textM && linkM) entries.push({ label: textM[1], url: resolve(linkM[1]) });
    }
  }
  return entries;
}

// ---------------------------------------------------------------------------
// Filesystem helpers.
// ---------------------------------------------------------------------------

// mirrors tools/migrate/jekyll.js — keep in sync
function readIfExists(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch { return null; }
}

/** Copy a directory recursively; returns the number of files copied. */
// mirrors tools/migrate/jekyll.js — keep in sync
function copyDir(src, dest) {
  let count = 0;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) count += copyDir(from, to);
    else if (entry.isFile()) { fs.copyFileSync(from, to); count += 1; }
  }
  return count;
}

// ---------------------------------------------------------------------------
// The import.
// ---------------------------------------------------------------------------

function main() {
  const flags = {};
  const componentMap = new Map();     // component name → replacement text ('' strips silently)
  const positional = [];
  for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--([\w-]+)(?:=(.*))?$/);
    if (!m) { positional.push(arg); continue; }
    if (m[1] === 'component') {       // repeatable: --component=Name=text
      const spec = m[2] || '';
      const eq = spec.indexOf('=');
      const name = eq === -1 ? spec : spec.slice(0, eq);
      if (name) componentMap.set(name, eq === -1 ? '' : spec.slice(eq + 1));
      continue;
    }
    flags[m[1]] = m[2] ?? true;
  }
  const [inputArg, outputArg] = positional;
  if (!inputArg) {
    console.error('Usage: node tools/migrate/vuepress.js <src-dir> [output-dir] [--collections=a,b] [--component=Name=replacement …] [--base=/subpath/]');
    process.exit(1);
  }
  let srcDir = path.resolve(inputArg);
  const outputDir = path.resolve(outputArg || 'plain-import');
  if (!fs.existsSync(srcDir) || !fs.statSync(srcDir).isDirectory()) {
    console.error(`Not a directory: ${srcDir}`);
    process.exit(1);
  }
  if (!fs.existsSync(path.join(srcDir, '.vuepress'))) {
    const probed = ['src', 'docs'].map((d) => path.join(srcDir, d)).find((d) => fs.existsSync(path.join(d, '.vuepress')));
    if (!probed) {
      console.error(`Not a VuePress source directory: ${srcDir} — pass the folder that contains ".vuepress/", e.g. mysite/src.`);
      process.exit(1);
    }
    console.log(`Note: descending into ${probed} (it holds .vuepress/).`);
    srcDir = probed;
  }

  const vuepressDir = path.join(srcDir, '.vuepress');
  const base = readBase(vuepressDir, flags.base);
  const publicFiles = buildPublicIndex(path.join(vuepressDir, 'public'));
  let siteTitle = null;
  for (const name of ['config.ts', 'config.js', 'config.mjs']) {
    const m = (readIfExists(path.join(vuepressDir, name)) || '').match(/title:\s*["']([^"']+)/);
    if (m) { siteTitle = m[1]; break; }
  }

  // ---- inventory ------------------------------------------------------------
  const mdFiles = [];
  const walk = (dir, rel) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(path.join(dir, entry.name), relPath);
      else if (entry.isFile() && /\.md$/i.test(entry.name)) mdFiles.push(relPath);
    }
  };
  walk(srcDir, '');
  mdFiles.sort();

  // Collections: top-level folders with two or more non-README .md files
  // (recursively). --collections replaces the automatic list.
  const perDir = {};
  for (const rel of mdFiles) {
    const [top, ...rest] = rel.split('/');
    if (rest.length && !/^(readme|index)\.md$/i.test(rest[rest.length - 1])) perDir[top] = (perDir[top] || 0) + 1;
  }
  const collectionDirs = typeof flags.collections === 'string'
    ? flags.collections.split(',').map((s) => s.trim()).filter(Boolean)
    : Object.keys(perDir).filter((d) => perDir[d] >= 2).sort();
  if (typeof flags.collections === 'string') {
    const tops = [...new Set(mdFiles.filter((r) => r.includes('/')).map((r) => r.split('/')[0]))].sort();
    for (const d of collectionDirs) {
      if (!tops.includes(d)) {
        console.error(`--collections names "${d}" but there is no top-level folder with that exact (case-sensitive) name — available folders: ${tops.join(', ') || 'none'}`);
        process.exit(1);
      }
    }
  }
  const collectionNames = collectionDirs.map(slugify);

  const redirects = {};               // emitted to data/redirects.json (old ≠ new only)
  const urlMap = {};                  // superset for navbar translation (includes old = new and file-path aliases)
  const review = [];                  // {file, notes: [...]}
  const written = {};                 // bucket → count
  const fmKeys = {};                  // bucket → Set of emitted frontmatter keys
  const componentTotals = new Map();  // component name → total occurrences
  const claimed = {};                 // "<bucket>/<slug>" → source file, for collision suffixes
  const noteFor = (file) => {
    let e = review.find((r) => r.file === file);
    if (!e) { e = { file, notes: [] }; review.push(e); }
    return e.notes;
  };
  // A `base` written as anything but a plain string literal (template literal,
  // env var) is invisible to the regex read — say so instead of silently
  // assuming "/", which would leave every old URL missing its subpath.
  if (typeof flags.base !== 'string') {
    for (const name of ['config.ts', 'config.js', 'config.mjs']) {
      const text = readIfExists(path.join(vuepressDir, name));
      if (text && /\bbase\s*:/.test(text) && !/base:\s*["']/.test(text)) {
        noteFor(`.vuepress/${name}`).push(`a "base" is set but could not be read — old URLs assume "/"; rerun with --base=/your-subpath/ if the site lives under one.`);
        break;
      }
    }
  }
  const claimSlug = (bucket, slug, relPath, notes) => {
    if (!claimed[`${bucket}/${slug}`]) { claimed[`${bucket}/${slug}`] = relPath; return slug; }
    let n = 2;
    while (claimed[`${bucket}/${slug}-${n}`]) n += 1;
    claimed[`${bucket}/${slug}-${n}`] = relPath;
    notes.push(`Slug "${slug}" collides with ${claimed[`${bucket}/${slug}`]} — this file was written as "${slug}-${n}"; review both.`);
    return `${slug}-${n}`;
  };

  // ---- content --------------------------------------------------------------
  const convertFile = (relPath) => {
    const segments = relPath.split('/');
    const baseName = segments[segments.length - 1].replace(/\.md$/i, '');
    const isReadme = /^(readme|index)$/i.test(baseName); // VuePress serves both as the folder index
    const top = segments.length > 1 ? segments[0] : null;
    const collection = top && collectionDirs.includes(top) ? slugify(top) : null;
    const subpath = segments.slice(1, -1);

    // A README inside a collection subfolder was that section's index page.
    // plain builds tag pages instead, so redirect it there and move on.
    if (collection && isReadme && subpath.length > 0) {
      const section = slugify(subpath.join('-'));
      const oldUrl = encodeURI(`${base}${top}/${subpath.join('/')}/`);
      const newUrl = `/${collection}/tag/${section}/`;
      redirects[oldUrl] = newUrl;
      urlMap[oldUrl] = newUrl;
      noteFor(relPath).push(`Section index dropped — plain builds ${newUrl} from the "${section}" tag instead; move any prose it had into a page or the list template.`);
      return;
    }

    const source = fs.readFileSync(path.join(srcDir, relPath), 'utf8');
    const { data, body: rawBody } = splitFrontmatter(source);
    const fmData = data || {};
    const notes = [];

    dropChrome(fmData, notes);
    flattenFrontmatter(fmData, notes);

    // Destination: collection item, or a page (READMEs are their folder's index).
    let bucket, slug, section = null;
    if (collection && !isReadme) {
      bucket = collection;
      section = subpath.length ? slugify(subpath.join('-')) : null;
      slug = slugify(section ? `${subpath.join('-')}-${baseName}` : baseName) || 'untitled';
    } else if (collection && isReadme) {
      bucket = 'pages';
      slug = `${collection}-index`;
      notes.push(`/${top}/ is now the "${collection}" collection list page; this page moved to /${slug}/ — rename it or fold it into the list template.`);
    } else {
      bucket = 'pages';
      if (isReadme) slug = segments.length === 1 ? 'index' : slugify(segments.slice(0, -1).join('-')) || 'untitled';
      else slug = slugify(segments.slice(0, -1).concat(baseName).join('-')) || 'untitled';
    }
    slug = claimSlug(bucket, slug, relPath, notes);
    const newUrl = bucket === 'pages' ? (slug === 'index' ? '/' : `/${slug}/`) : `/${bucket}/${slug}/`;

    let title = typeof fmData.title === 'string' || typeof fmData.title === 'number' ? String(fmData.title) : '';
    if (!title) {
      const nameSource = isReadme ? (segments.length === 1 ? 'Home' : segments[segments.length - 2]) : baseName;
      title = nameSource.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      notes.push(`Title missing — derived "${title}" from the ${isReadme ? 'folder' : 'file'} name.`);
    }

    // Body: components + containers + asset refs (code samples stay untouched).
    const body = convertBody(rawBody, componentMap, publicFiles);
    for (const [name, count] of body.counts) componentTotals.set(name, (componentTotals.get(name) || 0) + count);
    const stripped = [...body.counts.keys()].filter((n) => !componentMap.has(n)).sort();
    if (stripped.length) notes.push(`Stripped Vue components (review): ${stripped.map((n) => `${n} ×${body.counts.get(n)}`).join(', ')} — rerun with --component=Name=text to substitute, or rebuild as a plugin.`);
    notes.push(...body.notes);
    if (body.unknown.length) notes.push(`Removed unknown ::: container fences (content kept): ${body.unknown.join(', ')} — check the formatting.`);
    if (body.deeper) notes.push('Containers nested deeper than one level — some ::: fences remain; convert them by hand.');

    const fm = { title };
    const date = isoDateOf(fmData.date);
    if (date) fm.date = date;
    else if (fmData.date != null) notes.push(`Could not read date "${fmData.date}" — set an ISO date (YYYY-MM-DD) by hand if this item needs one.`);
    const description = fmData.description ?? fmData.excerpt;
    if (typeof description === 'string' && description.trim()) fm.description = description.trim();
    const cover = fmData.cover ?? fmData.image ?? fmData.banner;
    if (typeof cover === 'string' && cover.trim()) fm.cover = rewriteBareAsset(cover.trim(), publicFiles);
    const tags = collectTags(fmData);
    if (section) { fm.section = section; if (!tags.includes(section)) tags.push(section); }
    if (tags.length) fm.tags = tags;
    if (fmData.publish === false || fmData.draft === true) fm.draft = true;
    passthrough(fmData, fm);

    // Redirects. The collection-root README's old URL (/coll/) stays live as
    // the list page — unless the site had a base subpath, in which case the
    // old /base/coll/ URL is dead and points at the new list.
    const oldUrl = oldUrlFor(relPath, fmData.permalink, base);
    urlMap[oldUrl] = newUrl;
    if (typeof fmData.permalink === 'string') urlMap[oldUrlFor(relPath, null, base)] = newUrl; // navbars often link the file path, not the permalink
    if (collection && isReadme) {
      if (oldUrl !== `/${collection}/`) redirects[oldUrl] = `/${collection}/`;
    } else if (oldUrl !== newUrl) {
      redirects[oldUrl] = newUrl;
    }
    if (section) {
      // The bare section-folder URL is a common navbar/link target whether or
      // not it had a README, so map every section folder to its tag page.
      const dirOld = encodeURI(`${base}${top}/${subpath.join('/')}/`);
      const dirNew = `/${collection}/tag/${section}/`;
      if (dirOld !== dirNew) { redirects[dirOld] = dirNew; urlMap[dirOld] = dirNew; }
    }

    const dir = path.join(outputDir, 'content', bucket);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${slug}.md`), serializeFrontmatter(fm, ORDER) + '\n' + body.body + '\n');
    written[bucket] = (written[bucket] || 0) + 1;
    for (const key of Object.keys(fm)) (fmKeys[bucket] ||= new Set()).add(key);
    if (notes.length) noteFor(relPath).push(...notes);
  };

  for (const relPath of mdFiles) convertFile(relPath);

  // ---- media ----------------------------------------------------------------
  const publicDir = path.join(vuepressDir, 'public');
  const mediaCount = fs.existsSync(publicDir) ? copyDir(publicDir, path.join(outputDir, 'media', 'public')) : 0;

  // ---- redirects ------------------------------------------------------------
  const sortedRedirects = {};
  for (const key of Object.keys(redirects).sort()) sortedRedirects[key] = redirects[key];
  fs.mkdirSync(path.join(outputDir, 'data'), { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'data', 'redirects.json'), JSON.stringify(sortedRedirects, null, 2) + '\n');

  // ---- navigation -----------------------------------------------------------
  const navbarText = readIfExists(path.join(vuepressDir, 'navbar.ts')) ?? readIfExists(path.join(vuepressDir, 'navbar.js'));
  let navStatus = '- Navigation: no `.vuepress/navbar.ts` found — write `data/navigation.json` by hand (tools/migrate/README.md, step 6).';
  let navWritten = false;
  if (navbarText !== null) {
    const nav = parseNavbar(navbarText, urlMap, base);
    fs.writeFileSync(path.join(outputDir, 'data', 'navigation.json'), JSON.stringify(nav, null, 2) + '\n');
    navStatus = `- Navigation: ${nav.length} entries → \`data/navigation.json\``;
    navWritten = true;
    noteFor('.vuepress/navbar.ts').push('Best-effort regex read of the navbar object literal — check labels, order, and dropdown flattening before trusting it.');
  }

  // ---- report ---------------------------------------------------------------
  const report = buildReport({
    srcDir, outputDir, siteTitle, written, collectionNames, mediaCount,
    redirects: sortedRedirects, review, componentTotals, componentMap, fmKeys, navStatus, navWritten,
  });
  fs.writeFileSync(path.join(outputDir, 'MIGRATION-REPORT.md'), report);
  process.stdout.write(report);
}

/** Assemble the human-readable migration report (stdout + MIGRATION-REPORT.md). */
function buildReport({ srcDir, outputDir, siteTitle, written, collectionNames, mediaCount, redirects, review, componentTotals, componentMap, fmKeys, navStatus, navWritten }) {
  const L = [];
  L.push('# VuePress → plain migration report', '');
  L.push(`- Source: \`${srcDir}\``);
  if (siteTitle) L.push(`- VuePress site title: ${siteTitle}`);
  L.push(`- Output: \`${outputDir}\``, '');
  L.push('## Converted', '');
  for (const name of collectionNames) L.push(`- ${name} items converted: ${written[name] || 0} → \`content/${name}/*.md\``);
  L.push(`- Pages converted: ${written.pages || 0} → \`content/pages/*.md\``);
  L.push(`- Media files copied: ${mediaCount}${mediaCount ? ' (.vuepress/public/ → media/public/)' : ''}`);
  L.push(`- Redirects mapped: ${Object.keys(redirects).length} → \`data/redirects.json\``);
  L.push(navStatus, '');

  L.push('## Redirects (old VuePress URL → new plain URL)', '');
  if (Object.keys(redirects).length === 0) L.push('_None — every URL is unchanged._', '');
  else { for (const [from, to] of Object.entries(redirects)) L.push(`- \`${from}\` → \`${to}\``); L.push(''); }

  L.push('## Vue components', '');
  L.push('plain publishes static HTML, so Vue components cannot run. Each one was replaced or stripped:', '');
  if (componentTotals.size === 0) L.push('_None found._', '');
  else {
    L.push('| Component | Occurrences | Action |');
    L.push('| --- | --- | --- |');
    for (const name of [...componentTotals.keys()].sort()) {
      const action = !componentMap.has(name)
        ? `stripped — rerun with \`--component=${name}=…\` to substitute`
        : (componentMap.get(name) === '' ? 'stripped (as requested via `--component`)' : `replaced with \`${componentMap.get(name)}\``);
      L.push(`| ${name} | ${componentTotals.get(name)} | ${action} |`);
    }
    L.push('');
  }

  L.push('## Review queue', '');
  L.push('_Items the importer could not convert with full confidence. Each is a ready-to-run task for a human or an AI agent._', '');
  if (review.length === 0) L.push('_Empty — everything converted cleanly._', '');
  else for (const entry of review) { L.push(`### \`${entry.file}\``); for (const note of entry.notes) L.push(`- ${note}`); L.push(''); }

  L.push('## Dynamic-feature mapping (honest scoping)', '');
  L.push('VuePress sites lean on theme plugins for the moving parts. plain keeps the core serverless; here is where each piece goes:', '');
  L.push('| VuePress feature | plain equivalent |');
  L.push('| --- | --- |');
  L.push('| theme-hope `seo` / `sitemap` plugins | Built in — sitemap.xml, canonical + OG tags from fields |');
  L.push('| Search (`@vuepress/plugin-search`, DocSearch) | Built-in `search` plugin over the prebuilt index |');
  L.push('| GoatCounter / analytics scripts | `goatcounter` plugin (opt-in), or leave analytics out |');
  L.push('| Comments (Waline, Giscus, …) | giscus plugin (GitHub Discussions), or a static archive |');
  L.push('| RSS (theme-hope `feed`) | Built in — set `rss: true` on the collection |');
  L.push('| Vue components in Markdown | `--component=Name=text` substitution, or rebuild as a plugin (`client.js`) |');
  L.push('');

  // Field types inferred from the union of frontmatter keys actually emitted.
  const orderOf = (k) => { const i = ORDER.indexOf(k); return i === -1 ? ORDER.length : i; };
  const fieldsFor = (keys) => [...keys]
    .sort((a, b) => orderOf(a) - orderOf(b) || a.localeCompare(b))
    .map((name) => {
      if (name === 'title') return { name, type: 'text', required: true };
      if (name === 'date') return { name, type: 'date' };
      if (name === 'tags') return { name, type: 'list' };
      if (name === 'draft') return { name, type: 'boolean', default: false };
      if (name === 'cover') return { name, type: 'image' };
      return { name, type: 'text' };
    });
  const snippet = {
    pages: { path: 'content/pages', urlPattern: '/:slug/', template: 'page', fields: fieldsFor(fmKeys.pages || new Set()) },
  };
  for (const name of collectionNames) {
    const keys = fmKeys[name] || new Set();
    const def = { path: `content/${name}`, urlPattern: `/${name}/:slug/`, template: 'post', listUrl: `/${name}/`, listTemplate: 'list' };
    if (keys.has('date')) { def.sortBy = 'date'; def.sortOrder = 'desc'; }
    def.fields = fieldsFor(keys);
    snippet[name] = def;
  }
  L.push('## Suggested site.config.json snippet', '');
  L.push('Computed from the frontmatter keys the importer actually emitted; adjust to');
  L.push('taste. Section-folder redirects assume each collection keeps its `listUrl`');
  L.push('(`/<name>/`), so plain emits the tag pages they point at (`/<name>/tag/<tag>/`).', '');
  L.push('```json');
  L.push(JSON.stringify({ collections: snippet }, null, 2));
  L.push('```', '');

  L.push('## Next step', '');
  L.push('Copy the generated folders into your plain repository, then build:', '');
  L.push('```sh');
  L.push(`cp -R "${path.join(outputDir, 'content')}/." content/`);
  L.push(`cp -R "${path.join(outputDir, 'media')}/." media/    # if media/ was created`);
  L.push(`# merge "${path.join(outputDir, 'data', 'redirects.json')}" into your data/redirects.json`);
  if (navWritten) L.push(`# merge "${path.join(outputDir, 'data', 'navigation.json')}" into your data/navigation.json`);
  L.push('node build.js');
  L.push('```', '');
  return L.join('\n');
}

main();
