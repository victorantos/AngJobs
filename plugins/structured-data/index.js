/**
 * structured-data — Schema.org JSON-LD for search engines (engine plugin).
 *
 * Every page gets one <script type="application/ld+json"> before </head>, a
 * graph of:
 *   - the publisher: an Organization named after the site, or whatever
 *     `pluginOptions["structured-data"].publisher` says —
 *     `{ "type": "Person" | "Organization", "name", "url", "logo" }`;
 *   - WebSite, on the home page of every language;
 *   - WebPage: the page's title, description and language;
 *   - Article, on an item with a `date` in a collection that has a list page
 *     (a post): headline, dates, cover image, and the author — the item's
 *     `author` field as a Person when there is one, else the publisher.
 *
 * It is built from the page's own fields, so there is nothing to fill in, and
 * nothing is fetched or run in the browser (C5). Pages marked noindex get no
 * block: there is nothing to index. The build stays deterministic — no clock.
 * A site that wants product, event or recipe data writes its own plugin that
 * pushes more nodes; this one is deliberately the part every site shares.
 */
const NOINDEX = /<meta name="robots" content="[^"]*noindex/;

/**
 * The JSON-LD graph for a page, or null for a page that gets none.
 * @param {Record<string, any>} page the template context's page (item, list page or 404)
 * @param {{config: any}} site
 * @param {{publisher?: Record<string, string>}} [options]
 * @returns {Record<string, any>[] | null}
 */
export function graphFor(page, site, options = {}) {
  if (!page || !page.url || page.noindex) return null;
  const { site: siteConfig, collections: defs = {} } = site.config;
  const base = String(siteConfig.url || '').replace(/\/$/, '');
  const abs = (path) => (/^https?:\/\//.test(String(path)) ? String(path) : base + path);
  const defaultLang = siteConfig.language;
  const lang = page.language || defaultLang;
  const isHome = page.url === '/' || (lang !== defaultLang && page.url === `/${lang}/`);
  const publisherId = `${base}/#publisher`;
  const websiteId = `${base}/#website`;

  const who = options.publisher || {};
  const publisher = {
    '@type': who.type === 'Person' ? 'Person' : 'Organization',
    '@id': publisherId,
    name: who.name || siteConfig.title,
    url: who.url ? abs(who.url) : `${base}/`,
    ...(who.logo ? { logo: abs(who.logo) } : {}),
  };
  const graph = [publisher];

  if (isHome) {
    graph.push({
      '@type': 'WebSite',
      '@id': websiteId,
      url: `${base}/`,
      name: siteConfig.title,
      ...(siteConfig.description ? { description: siteConfig.description } : {}),
      inLanguage: lang,
      publisher: { '@id': publisherId },
    });
  }

  graph.push({
    '@type': 'WebPage',
    url: abs(page.url),
    name: page.title || siteConfig.title,
    ...(page.description ? { description: page.description } : {}),
    inLanguage: lang,
    isPartOf: { '@id': websiteId },
  });

  const def = page.collection ? defs[page.collection] : null;
  if (def?.listUrl && page.date) {
    const author = typeof page.author === 'string' && page.author
      ? { '@type': 'Person', name: page.author }
      : { '@id': publisherId };
    graph.push({
      '@type': 'Article',
      headline: page.title,
      ...(page.description ? { description: page.description } : {}),
      datePublished: String(page.date),
      ...(page.updated ? { dateModified: String(page.updated) } : {}),
      ...(page.cover ? { image: abs(page.cover) } : {}),
      inLanguage: lang,
      url: abs(page.url),
      mainEntityOfPage: abs(page.url),
      author,
      publisher: { '@id': publisherId },
    });
  }
  return graph;
}

/** The script tag for a graph; "<" is escaped so no "</script>" in a title can end it early. */
export function scriptFor(graph) {
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>\n`;
}

export default {
  renderPage(page, html, site, options) {
    if (NOINDEX.test(html)) return;
    const graph = graphFor(page, site, options);
    if (!graph) return;
    const at = html.indexOf('</head>');
    if (at === -1) return;
    return html.slice(0, at) + scriptFor(graph) + html.slice(at);
  },
};
