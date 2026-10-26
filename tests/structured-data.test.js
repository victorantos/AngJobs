// plugins/structured-data: the JSON-LD graph each kind of page gets, and the
// pages that get none. Built from a small in-memory site, no fixture needed.
import test from 'node:test';
import assert from 'node:assert/strict';
import plugin, { graphFor, scriptFor } from '../plugins/structured-data/index.js';

const site = {
  config: {
    site: { title: 'Fixture', url: 'https://fixture.test', description: 'A tiny site.', language: 'en', languages: ['en', 'fr'] },
    collections: {
      pages: { path: 'content/pages', urlPattern: '/:slug/' },
      posts: { path: 'content/posts', urlPattern: '/blog/:slug/', listUrl: '/blog/' },
    },
  },
};
const home = { url: '/', slug: 'index', title: 'Welcome', description: 'Hello.', collection: 'pages', language: 'en' };
const post = { url: '/blog/hello/', slug: 'hello', title: 'Hello', description: 'First.', date: '2026-07-05', cover: '/media/2026/07/lake.jpg', collection: 'posts', language: 'en' };
const types = (graph) => graph.map((node) => node['@type']);
const byType = (graph, type) => graph.find((node) => node['@type'] === type);

test('the home page gets the publisher, the site and the page; a plain page only the publisher and the page', () => {
  const graph = graphFor(home, site);
  assert.deepEqual(types(graph), ['Organization', 'WebSite', 'WebPage']);
  assert.equal(byType(graph, 'Organization').name, 'Fixture', 'the publisher defaults to the site');
  assert.equal(byType(graph, 'WebSite').url, 'https://fixture.test/');
  assert.equal(byType(graph, 'WebPage').url, 'https://fixture.test/');
  assert.deepEqual(types(graphFor({ url: '/about/', title: 'About', collection: 'pages' }, site)), ['Organization', 'WebPage']);
});

test('a dated item in a collection with a list page is an article, with its cover and the site as author', () => {
  const graph = graphFor(post, site);
  assert.deepEqual(types(graph), ['Organization', 'WebPage', 'Article']);
  const article = byType(graph, 'Article');
  assert.equal(article.headline, 'Hello');
  assert.equal(article.datePublished, '2026-07-05');
  assert.equal(article.image, 'https://fixture.test/media/2026/07/lake.jpg');
  assert.equal(article.mainEntityOfPage, 'https://fixture.test/blog/hello/');
  assert.deepEqual(article.author, { '@id': 'https://fixture.test/#publisher' });
  assert.equal(article.dateModified, undefined);
});

test('an author field names a person; an updated field is the modified date', () => {
  const article = byType(graphFor({ ...post, author: 'Ada', updated: '2026-08-01' }, site), 'Article');
  assert.deepEqual(article.author, { '@type': 'Person', name: 'Ada' });
  assert.equal(article.dateModified, '2026-08-01');
});

test('a dated page in a collection without a list page is no article', () => {
  assert.deepEqual(types(graphFor({ url: '/about/', title: 'About', date: '2026-01-01', collection: 'pages' }, site)), ['Organization', 'WebPage']);
});

test('the publisher option names a person or an organization with its own url and logo', () => {
  const [who] = graphFor(home, site, { publisher: { type: 'Person', name: 'Ada', url: '/about/' } });
  assert.deepEqual(who, { '@type': 'Person', '@id': 'https://fixture.test/#publisher', name: 'Ada', url: 'https://fixture.test/about/' });
  const [org] = graphFor(home, site, { publisher: { name: 'Fixture Ltd', logo: '/media/logo.png' } });
  assert.equal(org['@type'], 'Organization');
  assert.equal(org.logo, 'https://fixture.test/media/logo.png');
});

test('a translated page is in its language, and the translated home page gets the site node too', () => {
  const fr = graphFor({ ...home, url: '/fr/', language: 'fr' }, site);
  assert.deepEqual(types(fr), ['Organization', 'WebSite', 'WebPage']);
  assert.equal(byType(fr, 'WebSite').inLanguage, 'fr');
  const about = graphFor({ url: '/fr/about/', title: 'À propos', collection: 'pages', language: 'fr' }, site);
  assert.equal(byType(about, 'WebPage').inLanguage, 'fr');
  assert.equal(byType(about, 'WebPage').url, 'https://fixture.test/fr/about/');
  assert.equal(byType(about, 'WebSite'), undefined);
});

test('a list page is a page, the 404 and noindex pages get nothing', () => {
  assert.deepEqual(types(graphFor({ title: 'Blog', url: '/blog/' }, site)), ['Organization', 'WebPage']);
  assert.equal(graphFor({ title: 'Not found' }, site), null);
  assert.equal(graphFor({ url: '/thanks/', title: 'Thanks', noindex: true }, site), null);
  const html = '<html><head><meta name="robots" content="noindex"></head><body></body></html>';
  assert.equal(plugin.renderPage({ url: '/x/', title: 'X' }, html, site, {}), undefined);
});

test('renderPage puts one script before </head>, with "<" escaped so a title cannot close it', () => {
  const html = '<html><head><title>x</title></head><body></body></html>';
  const out = plugin.renderPage({ ...home, title: 'A </script><b>title' }, html, site, {});
  assert.equal(out.split('application/ld+json').length, 2);
  assert.ok(out.indexOf('<script type="application/ld+json">') < out.indexOf('</head>'));
  assert.ok(!out.includes('</script><b>title'));
  const json = out.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1];
  assert.equal(JSON.parse(json)['@context'], 'https://schema.org');
  assert.equal(JSON.parse(json)['@graph'][2].name, 'A </script><b>title', 'and reads back intact');
  assert.equal(plugin.renderPage(home, '<p>no head</p>', site, {}), undefined, 'a page without </head> is left alone');
  assert.ok(scriptFor([]).endsWith('</script>\n'));
});
