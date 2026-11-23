// lib/markdown.js — marked, configured (cms-spec.md §6 step 4): GFM plus
// heading anchor ids, rel="noopener" on external links, lazy/async images.
// Isomorphic: the admin reuses this module in the browser so previews match
// the build byte for byte (§10.2).

import { Marked } from 'marked';
import { slugify, escapeHtml } from './util.js';

/** Tracks heading ids within one document so duplicates get -1, -2 suffixes. */
let usedIds = new Set();

function headingId(text) {
  const base = slugify(text) || 'section';
  let id = base;
  // "Intro", "Intro", "Intro 1" must not give two "intro-1"s — skip taken ids.
  for (let n = 1; usedIds.has(id); n++) id = `${base}-${n}`;
  usedIds.add(id);
  return id;
}

const marked = new Marked();

marked.use({
  gfm: true,
  renderer: {
    heading(token) {
      const html = this.parser.parseInline(token.tokens);
      // The id comes from the visible text — not the Markdown, which would put
      // a link's URL or an entity's name ("&lt;" → "lt") into the anchor.
      const visible = html.replace(/<[^>]*>/g, '').replace(/&(?:#\d+|#x[0-9a-f]+|\w+);/gi, ' ');
      return `<h${token.depth} id="${headingId(visible)}">${html}</h${token.depth}>\n`;
    },
    link(token) {
      const html = this.parser.parseInline(token.tokens);
      const title = token.title ? ` title="${escapeHtml(token.title)}"` : '';
      const rel = /^https?:\/\//i.test(token.href) ? ' rel="noopener"' : '';
      return `<a href="${escapeHtml(token.href)}"${title}${rel}>${html}</a>`;
    },
    image(token) {
      const title = token.title ? ` title="${escapeHtml(token.title)}"` : '';
      return `<img src="${escapeHtml(token.href)}" alt="${escapeHtml(token.text)}"${title} loading="lazy" decoding="async">`;
    },
  },
});

/** Render a Markdown string to HTML. */
export function renderMarkdown(source) {
  usedIds = new Set(); // heading ids are unique per document
  return marked.parse(source);
}
