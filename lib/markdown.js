// lib/markdown.js — marked, configured (cms-spec.md §6 step 4): GFM plus
// heading anchor ids, rel="noopener" on external links, lazy/async images.
// Isomorphic: the admin reuses this module in the browser so previews match
// the build byte for byte (§10.2).

import { Marked } from 'marked';
import { slugify, escapeHtml } from './util.js';

/** Tracks heading ids within one document so duplicates get -1, -2 suffixes. */
let usedIds = new Map();

function headingId(text) {
  const base = slugify(text) || 'section';
  const seen = usedIds.get(base) || 0;
  usedIds.set(base, seen + 1);
  return seen === 0 ? base : `${base}-${seen}`;
}

const marked = new Marked();

marked.use({
  gfm: true,
  renderer: {
    heading(token) {
      const html = this.parser.parseInline(token.tokens);
      return `<h${token.depth} id="${headingId(token.text)}">${html}</h${token.depth}>\n`;
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
  usedIds = new Map(); // heading ids are unique per document
  return marked.parse(source);
}
