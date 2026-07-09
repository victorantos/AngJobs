// lib/util.js — small pure helpers shared by the build and the admin.
//
// Isomorphic: this module must never import `node:*` so it can run
// unmodified in the browser (cms-spec.md §10.2). Filesystem helpers
// live in build.js, which is Node-only.

/** Turn any text into a URL-safe slug: "Héllo, World!" → "hello-world". */
export function slugify(text) {
  return String(text).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Escape text for safe interpolation into HTML. */
export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Escape text for XML documents (sitemap, RSS). */
export function escapeXml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
}

/** True for a valid ISO date string like "2026-07-05". */
export function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

/** "2026-07-05" → "July 5, 2026" (in the site's language). */
export function formatDate(isoDate, language = 'en') {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString(language, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

/** "2026-07-05" → RFC 822 date for RSS pubDate fields. */
export function rfc822Date(isoDate) {
  return new Date(`${isoDate}T00:00:00Z`).toUTCString();
}

/** Reduce rendered HTML to plain text (for search indexes and summaries). */
export function stripHtml(html) {
  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Deep-merge `over` onto `base` (objects merge, everything else replaces). Layers
    the user's sparse site.config.json over config.defaults.json (§14.3). */
export function deepMerge(base, over) {
  if (over === null || typeof over !== 'object' || Array.isArray(over)) return over === undefined ? base : over;
  const out = { ...base };
  for (const key of Object.keys(over)) {
    const b = base?.[key];
    out[key] = b && typeof b === 'object' && !Array.isArray(b) ? deepMerge(b, over[key]) : over[key];
  }
  return out;
}
