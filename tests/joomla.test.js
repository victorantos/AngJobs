// Tests for the Joomla importer (tools/migrate/joomla.js, cms-spec.md §15).
// Joomla has no export format, so the importer crawls the rendered site; the
// fixture is a hand-built mini "rendered Joomla site" served by a local
// node:http server on an ephemeral port — no network, deterministic output.
// The importer is a CLI, so we run it as a child process (async, because the
// fixture server lives in this process and must keep answering requests).

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const importer = path.join(root, 'tools', 'migrate', 'joomla.js');
const fixtures = path.join(root, 'tools', 'migrate', 'fixtures', 'joomla');
const out = path.join(root, 'tests', '.tmp-joomla');

// Route table of the fake Joomla site. Keys are pathname + sorted query —
// the same canonical form the importer's URL normalizer produces.
const ROUTES = {
  '/': 'index.html',
  '/field-notes': 'field-notes.html',
  '/field-notes?start=5': 'field-notes-2.html',
  '/blog/23-first-post': 'blog/23-first-post.html',
  '/index.php?id=24&option=com_content&view=article': 'hidden-article.html',
  '/about': 'about.html',
  '/contact': 'contact.html',
  '/weird': 'weird.html',
  '/secret/decoy': 'decoy.html',
  '/images/lake.jpg': 'images/lake.jpg',
  '/robots.txt': 'robots.txt',
};
const TYPES = { '.html': 'text/html; charset=utf-8', '.jpg': 'image/jpeg', '.txt': 'text/plain' };

/** Request handler serving the fixture site; logs each canonicalized key. */
const fixtureHandler = (requested) => (req, res) => {
  const u = new URL(req.url, 'http://fixture');
  u.searchParams.sort();
  const key = u.pathname + (u.searchParams.size ? '?' + u.searchParams.toString() : '');
  requested.push(key);
  const route = ROUTES[key];
  if (!route) { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('not found'); return; }
  const file = path.join(fixtures, route);
  res.writeHead(200, { 'content-type': TYPES[path.extname(route)] || 'application/octet-stream' });
  res.end(fs.readFileSync(file));
};

const listen = (server) => new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

test('Joomla importer: crawl the fixture site end to end', async (t) => {
  const requested = [];
  const server = http.createServer(fixtureHandler(requested));
  await listen(server);
  const base = `http://127.0.0.1:${server.address().port}/`;

  fs.rmSync(out, { recursive: true, force: true });
  t.after(() => fs.rmSync(out, { recursive: true, force: true }));   // clean up even when a subtest fails
  try {
    await promisify(execFile)('node', [importer, base, out, '--delay=0']);
  } finally {
    server.close();
  }
  const read = (rel) => fs.readFileSync(path.join(out, rel), 'utf8');
  const report = read('MIGRATION-REPORT.md');

  await t.test('dated articles become posts; the numeric ID prefix leaves the slug', () => {
    const post = read('content/posts/first-post.md');
    assert.match(post, /^---\ntitle: First Post\ndate: 2024-03-05\n/, 'title + ISO date first');
    assert.match(post, /description: The lighthouse path reopened this week/, 'meta description carried over');
    assert.match(post, /cover: \/media\/images\/lake\.jpg/, 'og:image became the cover, rewritten to media/');
    assert.match(post, /tags:\n {2}- Field Notes\n {2}- Travel\n {2}- Paths/, 'breadcrumb category merged with Joomla tags');
    assert.match(post, /author: Maria Vos/, '"Written by" chrome stripped from the author');
  });

  await t.test('article HTML converts to Markdown', () => {
    const post = read('content/posts/first-post.md');
    assert.match(post, /The \*\*lighthouse path\*\* reopened/, 'strong → **');
    assert.match(post, /\[about page\]\(\/about\/\)/, 'internal link rewritten to the new URL');
    assert.match(post, /!\[The lake at dawn\]\(\/media\/images\/lake\.jpg\)/, 'image rewritten to media/');
    assert.match(post, /## Getting there/, 'h2 → ##');
    assert.match(post, /- Follow the coast path\n\n {2}- Ignore the first stile/, 'nested list indented');
    assert.match(post, /\| Day \| High tide \|\n\| --- \| --- \|\n\| Saturday \| 06:40 \|/, 'table → pipe table');
    assert.match(post, /> The sea does not reward/, 'blockquote → >');
    assert.match(post, /```sh\ntide --port westhaven --days 2\n```/, 'pre/code → fenced block with language');
    assert.match(post, /\[email\]\(mailto:notes@example\.com\)/, 'mailto link untouched');
  });

  await t.test('dateless articles become pages', () => {
    const page = read('content/pages/about.md');
    assert.match(page, /^---\ntitle: About\n/, 'page frontmatter');
    assert.ok(!page.includes('date:'), 'no date on a page');
    assert.ok(!fs.existsSync(path.join(out, 'content/posts/about.md')), 'not written as a post');
  });

  await t.test('redirects map every moved path URL; query URLs go to the report', () => {
    const redirects = JSON.parse(read('data/redirects.json'));
    assert.equal(redirects['/blog/23-first-post/'], '/blog/first-post/', 'SEF article path redirects');
    assert.equal(redirects['/field-notes/'], '/blog/', 'category listing redirects to the blog list');
    assert.equal(redirects['/weird/'], '/blog/weird/');
    assert.ok(!Object.keys(redirects).some((k) => k.includes('?')), 'no query strings in redirects.json');
    assert.match(report, /`\/index\.php\?id=24&option=com_content&view=article` → `\/blog\/hidden-gem\/`/, 'non-SEF URL listed as a host-level rule');
  });

  await t.test('an article reachable only via its non-SEF URL is still imported', () => {
    const post = read('content/posts/hidden-gem.md');
    assert.match(post, /^---\ntitle: Hidden Gem\ndate: 2024-04-01\n/, 'slug derived from the title');
  });

  await t.test('the main menu becomes data/navigation.json', () => {
    const nav = JSON.parse(read('data/navigation.json'));
    assert.deepEqual(nav, [
      { label: 'Home', url: '/' },
      { label: 'Blog', url: '/blog/' },
      { label: 'About', url: '/about/' },
      { label: 'Friends', url: 'https://example.org/' },
    ], 'internal entries remapped, contact (not imported) dropped, external kept');
  });

  await t.test('media referenced by content is downloaded and rewritten', () => {
    const lake = path.join(out, 'media', 'images', 'lake.jpg');
    assert.ok(fs.existsSync(lake), 'image downloaded');
    assert.equal(fs.readFileSync(lake).length, fs.readFileSync(path.join(fixtures, 'images/lake.jpg')).length, 'bytes intact');
  });

  await t.test('exotic markup survives as raw HTML plus a review note', () => {
    const post = read('content/posts/weird.md');
    assert.match(post, /<iframe src="https:\/\/example\.org\/harborcam"/, 'iframe kept verbatim');
    assert.match(post, /Painted text survives as plain text/, 'styled span reduced to its text');
    assert.match(report, /### `\/weird`\n- Kept a <iframe> as raw HTML/, 'review-queue note names the page');
  });

  await t.test('hostile content converts without crashing or corrupting Markdown', () => {
    const post = read('content/posts/weird.md');
    assert.match(post, /1\\\. Reboot the cam/, 'prose starting like an ordered list is escaped');
    assert.match(post, /maintenance\\_log/, 'underscores in prose escaped, not emphasis');
    assert.match(post, /!\[50% off\]\(\/media\/images\/50%off\.jpg\)/, 'stray % in an image path survives (no decodeURIComponent crash)');
    assert.match(post, /&#99999999; stays literal/, 'out-of-range numeric entity left verbatim (no fromCodePoint crash)');
    assert.match(report, /Image download failed \(HTTP 404\)/, 'failed image download lands in the review queue');
  });

  await t.test('robots.txt is respected and non-content components are skipped', () => {
    assert.ok(!requested.includes('/secret/decoy'), 'disallowed URL never fetched');
    assert.ok(!requested.includes('/print/decoy'), 'wildcard-disallowed URL (/*/decoy$) never fetched');
    assert.ok(requested.includes('/robots.txt'), 'robots.txt consulted');
    assert.ok(!fs.existsSync(path.join(out, 'content/pages/contact.md')), 'com_contact page not imported');
    assert.match(report, /Skipped 1 contact form page\(s\)/, 'component skip reported');
    assert.match(report, /Contact forms \(com_contact, RSForm, …\) \| `contact-form` plugin/, 'dynamic-feature table present');
  });

  await t.test('the report is honest about coverage', () => {
    assert.match(report, /crawled \d+ page\(s\)/);
    assert.match(report, /Generator: Joomla!/, 'Joomla detected');
    // The fixture's tag links (/tags/…) 404 — real crawls hit these too, and
    // they must land in the report as fetch errors, not kill the import.
    assert.match(report, /## Fetch errors\n\n- `\/tags\/travel` — HTTP 404\n- `\/tags\/paths` — HTTP 404/, '404s recorded, not fatal');
  });
});

// Nearly every real Joomla site 301s to its canonical host (naked → www,
// http → https). The crawler must adopt the redirected origin and import the
// whole site from there — not import one orphaned homepage.
test('Joomla importer: a canonical-host redirect is followed and the site imports whole', async (t) => {
  const site = http.createServer(fixtureHandler([]));
  await listen(site);
  const canonical = `http://127.0.0.1:${site.address().port}`;
  const redirector = http.createServer((req, res) => {
    res.writeHead(301, { location: canonical + req.url });
    res.end();
  });
  await listen(redirector);

  const outDir = path.join(root, 'tests', '.tmp-joomla-www');
  fs.rmSync(outDir, { recursive: true, force: true });
  t.after(() => fs.rmSync(outDir, { recursive: true, force: true }));
  try {
    await promisify(execFile)('node', [importer, `http://127.0.0.1:${redirector.address().port}/`, outDir, '--delay=0']);
  } finally {
    site.close();
    redirector.close();
  }

  assert.ok(fs.existsSync(path.join(outDir, 'content/posts/first-post.md')), 'articles crawled on the canonical host');
  const report = fs.readFileSync(path.join(outDir, 'MIGRATION-REPORT.md'), 'utf8');
  assert.match(report, /crawled [4-9] page\(s\)/, 'the whole site imported, not just the redirected homepage');
  const redirects = JSON.parse(fs.readFileSync(path.join(outDir, 'data', 'redirects.json'), 'utf8'));
  assert.equal(redirects['/blog/23-first-post/'], '/blog/first-post/', 'redirect map built on the canonical host');
});

// A crawled page may 301 to a foreign site (a retired /shop, a link shortener).
// Its content must not be imported — and a %5C-encoded image path must not be
// able to place a file outside the output directory when joined on Windows.
test('Joomla importer: off-site redirects are skipped and image paths cannot escape the output dir', async (t) => {
  const evil = http.createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end('<!doctype html><html><head><title>EVIL</title></head><body class="site com_content view-article"><article><h1>EVIL</h1><p>EVIL CONTENT</p></article></body></html>');
  });
  await listen(evil);
  const trapPage = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="generator" content="Joomla! - Open Source Content Management"><title>Trap</title></head>
<body class="site com_content view-article">
<article>
  <h1>Trap</h1>
  <p><img src="/images/a%5C..%5C..%5C..%5Cpwned.txt" alt="Escape attempt"></p>
  <p><a href="/leave">A page that redirects off-site</a></p>
</article>
</body></html>`;
  const site = http.createServer((req, res) => {
    if (req.url === '/leave') { res.writeHead(301, { location: `http://127.0.0.1:${evil.address().port}/` }); res.end(); return; }
    if (req.url.startsWith('/images/')) { res.writeHead(200, { 'content-type': 'image/png' }); res.end('bytes'); return; }
    if (req.url === '/robots.txt') { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(trapPage);
  });
  await listen(site);

  const outDir = path.join(root, 'tests', '.tmp-joomla-hostile');
  fs.rmSync(outDir, { recursive: true, force: true });
  t.after(() => fs.rmSync(outDir, { recursive: true, force: true }));
  try {
    await promisify(execFile)('node', [importer, `http://127.0.0.1:${site.address().port}/`, outDir, '--delay=0']);
  } finally {
    site.close();
    evil.close();
  }

  const home = fs.readFileSync(path.join(outDir, 'content', 'pages', 'index.md'), 'utf8');
  assert.match(home, /!\[Escape attempt\]\(\/media\/images\/a\/pwned\.txt\)/, 'backslash segments neutralized in the reference');
  const mediaFiles = fs.readdirSync(path.join(outDir, 'media'), { recursive: true })
    .filter((p) => fs.statSync(path.join(outDir, 'media', p)).isFile())
    .map((p) => p.split(path.sep).join('/'));
  assert.deepEqual(mediaFiles, ['images/a/pwned.txt'], 'the file landed inside media/, traversal segments dropped');
  assert.ok(!home.includes('EVIL'), 'foreign content not imported');
  const report = fs.readFileSync(path.join(outDir, 'MIGRATION-REPORT.md'), 'utf8');
  assert.match(report, /`\/leave` — redirects off-site to http:\/\/127\.0\.0\.1:\d+\/ — not imported/, 'off-site redirect recorded as a fetch error');
});
