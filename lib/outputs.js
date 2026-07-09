// lib/outputs.js — the non-HTML build outputs (cms-spec.md §6 steps 7–8):
// sitemap.xml, rss.xml, robots.txt, _redirects + meta-refresh fallbacks,
// and the static read-only JSON API under api/.
// Every function takes data in and returns strings; build.js writes files.

import { escapeXml, escapeHtml, rfc822Date, stripHtml } from './util.js';

/** search-index.json: what the search plugin (and anything else) queries. */
export function searchIndex(collections) {
  const entries = [];
  for (const items of Object.values(collections)) {
    for (const item of items) {
      entries.push({ url: item.url, title: item.title || item.slug, description: item.description || '', tags: item.tags || [], text: stripHtml(item.content || '').slice(0, 2000) });
    }
  }
  return JSON.stringify(entries) + '\n';
}

/** @param {{loc: string, lastmod?: string}[]} entries - absolute URLs */
export function sitemapXml(entries) {
  const urls = entries.map(({ loc, lastmod }) => `  <url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
}

/** RSS 2.0 feed for one collection. Deterministic: dates come from items, not the clock. */
export function rssXml(site, feedUrl, listUrl, items) {
  const entries = items.map((item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(site.url + item.url)}</link>
      <guid>${escapeXml(site.url + item.url)}</guid>
      ${item.date ? `<pubDate>${rfc822Date(item.date)}</pubDate>` : ''}
      ${item.description ? `<description>${escapeXml(item.description)}</description>` : ''}
    </item>`);
  const newest = items.map((i) => i.date).filter(Boolean).sort().at(-1);
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(site.title)}</title>
    <link>${escapeXml(site.url + listUrl)}</link>
    <atom:link href="${escapeXml(site.url + feedUrl)}" rel="self" type="application/rss+xml"/>
    <description>${escapeXml(site.description || '')}</description>
    <language>${escapeXml(site.language)}</language>
    ${newest ? `<lastBuildDate>${rfc822Date(newest)}</lastBuildDate>` : ''}
${entries.join('\n')}
  </channel>
</rss>
`;
}

export function robotsTxt(siteUrl) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
}

/** Cloudflare/Netlify _redirects file from the {"/old/": "/new/"} map. */
export function redirectsFile(map) {
  return Object.entries(map).map(([from, to]) => `${from} ${to} 301`).join('\n') + '\n';
}

/**
 * The static JSON API: api/site.json (config + navigation), one index per
 * collection, and one file per item. Items carry both the raw Markdown
 * (`body`) and the rendered HTML (`content`). Drafts never appear — they
 * were excluded at load time.
 * @returns {Map<string, string>} file path → JSON
 */
export function apiFiles(config, data, collections) {
  const files = new Map();
  const json = (value) => JSON.stringify(value, null, 2) + '\n';
  files.set('api/site.json', json({ site: config.site, collections: config.collections, plugins: config.plugins, services: config.services, navigation: data.navigation || [] }));
  for (const [name, items] of Object.entries(collections)) {
    files.set(`api/${name}/index.json`, json({ items }));
    for (const item of items) {
      // An item named index.md would collide with the collection listing;
      // it has no per-item file — the listing above carries it in full.
      if (item.slug !== 'index') files.set(`api/${name}/${item.slug}.json`, json(item));
    }
  }
  return files;
}

/**
 * llms.txt — a compact, AI-legible site map per the llms.txt convention:
 * H1 title, blockquote summary, then link lists per collection.
 */
export function llmsTxt(config, collections) {
  const { site } = config;
  const lines = [`# ${site.title}`, ''];
  if (site.description) lines.push(`> ${site.description}`, '');
  lines.push(`All content is also machine-readable JSON under ${site.url}/api/ (site.json, <collection>/index.json, <collection>/<slug>.json).`, '');
  for (const [name, def] of Object.entries(config.collections)) {
    if (!collections[name]?.length) continue;
    lines.push(`## ${def.label}`, '');
    for (const item of collections[name]) {
      lines.push(`- [${item.title || item.slug}](${site.url}${item.url})${item.description ? `: ${item.description}` : ''}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

/** Meta-refresh fallback page for hosts without redirect support (GitHub Pages). */
export function redirectHtml(to) {
  const href = escapeHtml(to);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=${href}">
<link rel="canonical" href="${href}">
<title>Redirecting…</title>
</head>
<body>
<p>This page has moved to <a href="${href}">${href}</a>.</p>
</body>
</html>
`;
}
