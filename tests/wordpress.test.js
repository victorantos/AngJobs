// Tests for the WordPress importer (tools/migrate/wordpress.js, cms-spec.md §15).
// The fixture is a hand-built WXR export (tools/migrate/fixtures/wordpress/)
// covering Gutenberg + classic content, shortcodes, every post status, child
// pages, menus, comments and a page builder. Media comes from the fixture's
// uploads/ folder (--uploads) or from a local node:http server standing in
// for the live site — never the network. The importer is a CLI, so it runs as
// a child process (async, so the fixture server in this process can answer).

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter, validateFields } from '../lib/content.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const importer = path.join(root, 'tools', 'migrate', 'wordpress.js');
const fixtures = path.join(root, 'tools', 'migrate', 'fixtures', 'wordpress');
const tmp = path.join(root, 'tests', '.tmp-wordpress');
const execFileAsync = promisify(execFile);

test.after(() => fs.rmSync(tmp, { recursive: true, force: true }));

/** Run the importer into tests/.tmp-wordpress/<name>/ and return read helpers. */
async function run(name, args, exportFile = path.join(fixtures, 'export.xml')) {
  const out = path.join(tmp, name);
  fs.rmSync(out, { recursive: true, force: true });
  const { stdout } = await execFileAsync('node', [importer, exportFile, out, ...args]);
  const read = (rel) => fs.readFileSync(path.join(out, rel), 'utf8');
  return {
    out,
    stdout,
    read,
    has: (rel) => fs.existsSync(path.join(out, rel)),
    json: (rel) => JSON.parse(read(rel)),
    report: read('MIGRATION-REPORT.md'),
  };
}

const uploadsArgs = [`--uploads=${path.join(fixtures, 'uploads')}`];

test('every imported file parses and validates against plain’s own schema', async () => {
  const r = await run('schema', uploadsArgs);
  // The fixture site's schema, not the repo's own site.config.json: this test ships into every site, and a
  // site is free to have no "posts" collection.
  const config = JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures/site/site.config.json'), 'utf8'));
  config.collections.posts.fields.push({ name: 'cover', type: 'image' });
  for (const collection of ['posts', 'pages']) {
    const dir = path.join(r.out, 'content', collection);
    const files = fs.readdirSync(dir);
    assert.ok(files.length > 0, `${collection} imported`);
    for (const file of files) {
      const rel = `content/${collection}/${file}`;
      const { data, lineOf } = parseFrontmatter(r.read(rel), rel);   // throws on anything plain can't read
      validateFields(data, config.collections[collection].fields, rel, lineOf);
      assert.match(file, /^[a-z0-9-]+\.md$/, `${rel} is a valid slug`);
    }
  }
});

test('a Gutenberg post: frontmatter, blocks, links, media, reusable block', async () => {
  const r = await run('gutenberg', uploadsArgs);
  const post = r.read('content/posts/hello-world.md');
  assert.match(post, /^---\ntitle: Hello & welcome, lake people\ndate: 2024-05-06\n/, 'entities decoded, ISO date');
  assert.match(post, /description: First post on the new lake blog\./, 'Yoast description beats the excerpt');
  assert.match(post, /cover: \/media\/2024\/05\/lake\.jpg/, 'featured image → cover');
  assert.match(post, /tags:\n {2}- News\n {2}- Releases\n {2}- Launch\n/, 'categories + tags merged');
  assert.match(post, /author: Ada Lake/, 'display name, because the site has two authors');
  assert.match(post, /\[about us\]\(\/about\/\)/, 'absolute internal link → new path');
  assert.match(post, /\[classic post\]\(\/blog\/classic-post\/\)/, '?p=2 link → the post’s new URL');
  assert.match(post, /^## The lake$/m);
  assert.match(post, /\[!\[A calm lake\]\(\/media\/2024\/05\/lake-1024x768\.jpg\)\]\(\/media\/2024\/05\/lake\.jpg\)\n\n\*Morning on the lake\*/, 'image block keeps its link (attachment page → the full-size file) and caption');
  assert.match(post, /!\[Trail\]\(\/media\/2024\/05\/trail\.jpg\)\n\n!\[Dock\]\(\/media\/2024\/05\/dock\.jpg\)/, 'every gallery image kept');
  assert.match(post, /\(https:\/\/www\.youtube\.com\/watch\?v=abc_123\)/, 'embed block → link');
  assert.match(post, /```\nif \(a < b\) \{ swim\(\); \}\n```/, 'code block, entities decoded');
  assert.match(post, /^- Swim\n- Hike$/m);
  assert.match(post, /^> Lakes are the eyes of the land\.$/m);
  assert.match(post, /Subscribe for lake news\./, 'reusable block inlined');
  assert.match(post, /\[trail map\]\(\/media\/2024\/05\/map\.pdf\)/, 'linked upload → media');
  assert.doesNotMatch(post, /wp:|wp-content|wp\.example\.test/, 'no WordPress leftovers');
});

test('a classic-editor post: paragraphs, line breaks, shortcodes, literal brackets', async () => {
  const r = await run('classic', uploadsArgs);
  const post = r.read('content/posts/classic-post.md');
  assert.match(post, /description: A classic excerpt\./, 'HTML excerpt → plain text');
  assert.doesNotMatch(post, /^tags:/m, '"Uncategorized" is not a tag');
  assert.match(post, /First paragraph of a classic post\.\\\nSame paragraph, new line\./, 'newline → hard break, no stray indent');
  assert.match(post, /!\[Trail\]\(\/media\/2024\/05\/trail\.jpg\)\n\n\*The trail in May\*/, '[caption] → image + caption');
  assert.match(post, /```js\nif \(x < 1\) \{ go\(\); \}\n```/, '[code lang] → fenced block with language');
  assert.match(post, /\(https:\/\/vimeo\.com\/12345\)/, 'bare URL line (oEmbed) → link');
  assert.match(post, /\\\[sic\\\]/, 'ordinary [bracketed] text survives');
  assert.match(post, /\\\]\\\]&gt; sometimes/, 'a CDATA-split "]]>" is reassembled');
  assert.doesNotMatch(post, /contact-form-7|\[gallery|\[caption/, 'shortcodes gone');
  assert.match(post, /Last paragraph\.\n$/);
});

test('statuses: only public content is live; the rest are drafts with a reason', async () => {
  const r = await run('status', uploadsArgs);
  const draft = r.read('content/posts/half-written-idea.md');
  assert.match(draft, /date: 1970-01-01/, 'undated draft gets a placeholder date');
  assert.match(draft, /draft: true/);
  for (const slug of ['private-thoughts', 'coming-soon', 'members-only']) {
    assert.match(r.read(`content/posts/${slug}.md`), /draft: true/, `${slug} is a draft`);
  }
  assert.ok(!r.has('content/posts/deleted.md') && !r.has('content/posts/deleted-trashed.md'), 'trash skipped');
  assert.match(r.report, /Was \*\*Private\*\*/);
  assert.match(r.report, /Was \*\*scheduled\*\* for 2030-01-01/);
  assert.match(r.report, /Was \*\*password-protected\*\*/);
  assert.match(r.report, /set `date:` before you publish it/);
  // Non-public posts get no live redirect (it would point at a missing page) — the report explains how to add one.
  const redirects = r.json('data/redirects.json');
  assert.equal(redirects['/2024/02/02/members-only/'], undefined);
  assert.match(r.report, /"\/2024\/02\/02\/members-only\/": "\/blog\/members-only\/"/);
});

test('pages: front page, flattened children, reserved addresses, page builders', async () => {
  const r = await run('pages', uploadsArgs);
  assert.match(r.read('content/pages/index.md'), /Welcome home\./, 'the static front page → index.md');
  assert.match(r.read('content/pages/team.md'), /The people\./, '/about/team/ → team');
  assert.match(r.read('content/pages/careers-team.md'), /Recruiters\./, 'a second "team" takes its parent’s name');
  assert.ok(r.has('content/pages/admin-page.md'), 'reserved slug renamed');
  assert.ok(!r.has('content/pages/blog-page.md'), 'the empty WordPress "Posts page" is skipped — plain’s list is /blog/');
  assert.match(r.read('content/pages/services.md'), /## Guided tours\n\nWe guide you round the lake\./, 'Divi text kept');
  assert.doesNotMatch(r.read('content/pages/services.md'), /et_pb/, 'builder shortcodes gone');
  assert.match(r.report, /page builder \(Divi\)/);
  assert.match(r.report, /"Posts page"/, 'the empty page is explained');
});

test('redirects cover posts, pages and archives — and never hijack plain’s own addresses', async () => {
  const r = await run('redirects', uploadsArgs);
  const redirects = r.json('data/redirects.json');
  assert.equal(redirects['/2024/05/06/hello-world/'], '/blog/hello-world/');
  assert.equal(redirects['/about/team/'], '/team/');
  assert.equal(redirects['/careers/team/'], '/careers-team/');
  assert.equal(redirects['/2024/01/15/привет/'], '/blog/post-7/', 'non-Latin slug: key decoded, so static hosts find the fallback page');
  assert.equal(redirects['/category/news/'], '/blog/tag/news/');
  assert.equal(redirects['/category/news/releases/'], '/blog/tag/releases/', 'nested category path');
  assert.equal(redirects['/category/uncategorized/'], '/blog/');
  assert.equal(redirects['/tag/launch/'], '/blog/tag/launch/');
  assert.equal(redirects['/tag/unused/'], '/blog/', 'a tag with no posts has no tag page');
  assert.equal(redirects['/2024/05/'], '/blog/', 'date archive');
  assert.equal(redirects['/author/ada/'], '/blog/');
  assert.equal(redirects['/feed/'], '/blog/rss.xml');
  assert.equal(redirects['/about/'], undefined, 'unchanged URLs need no redirect');
  for (const from of Object.keys(redirects)) {
    assert.doesNotMatch(from, /^\/(admin|api|media|assets|plugins|search)(\/|$)|^\/blog\/$/, `${from} must not shadow a plain address`);
  }
  assert.deepEqual(Object.keys(redirects), Object.keys(redirects).slice().sort(), 'sorted, so reruns diff cleanly');
});

test('menu → data/navigation.json; comments → a privacy-safe archive', async () => {
  const r = await run('nav', uploadsArgs);
  assert.deepEqual(r.json('data/navigation.json'), [
    { label: 'Home', url: '/' },
    { label: 'About', url: '/about/' },
    { label: 'News', url: '/blog/tag/news/' },
    { label: 'Weather', url: 'https://weather.example.org/lake' },
  ]);
  assert.match(r.report, /Other menus not imported: "Footer"/);
  assert.match(r.report, /1 drop-down \(nested\) menu entry/);

  const comments = r.json('data/comments.json');
  assert.deepEqual(Object.keys(comments), ['/blog/hello-world/']);
  assert.equal(comments['/blog/hello-world/'].length, 1, 'spam and pingbacks dropped');
  assert.equal(comments['/blog/hello-world/'][0].content, 'Lovely post!\n\nSecond paragraph.');
  const raw = r.read('data/comments.json');
  assert.doesNotMatch(raw, /@private\.test|203\.0\.113/, 'no e-mail or IP addresses');
});

test('media: copied from --uploads into media/YYYY/MM/; report accounts for the rest', async () => {
  const r = await run('media', uploadsArgs);
  for (const f of ['lake.jpg', 'lake-1024x768.jpg', 'trail.jpg', 'dock.jpg', 'map.pdf']) {
    assert.ok(r.has(`media/2024/05/${f}`), `${f} copied`);
  }
  assert.ok(!r.has('media/2023/01/unused.png'), 'unused library files are left behind');
  assert.match(r.report, /5 of 5 file\(s\) copied/);
  assert.match(r.report, /1 file\(s\) in your WordPress media library aren't used/);
  assert.match(r.report, /Links to old address\(es\) this import has no page for: `\/shop\/`/);
  assert.match(r.report, /"product"/, 'custom post types are reported, not silently dropped');
});

test('media: downloaded from the live site; failures land in the report', async () => {
  const served = {
    '/wp-content/uploads/2024/05/lake.jpg': 'lake',
    '/wp-content/uploads/2024/05/lake-1024x768.jpg': 'lake-large',
    '/wp-content/uploads/2024/05/trail.jpg': 'trail',
    '/wp-content/uploads/2024/05/map.pdf': 'map',
    // dock.jpg is missing on purpose
  };
  const server = http.createServer((req, res) => {
    const body = served[new URL(req.url, 'http://x').pathname];
    res.writeHead(body ? 200 : 404, { 'content-type': 'application/octet-stream' });
    res.end(body ?? 'not found');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    fs.mkdirSync(tmp, { recursive: true });
    const exportFile = path.join(tmp, 'export-local.xml');
    fs.writeFileSync(exportFile, fs.readFileSync(path.join(fixtures, 'export.xml'), 'utf8').replaceAll('https://wp.example.test', base));
    const r = await run('download', ['--delay=0'], exportFile);
    assert.equal(r.read('media/2024/05/trail.jpg'), 'trail');
    assert.equal(r.read('media/2024/05/lake.jpg'), 'lake');
    assert.ok(!r.has('media/2024/05/dock.jpg'));
    assert.match(r.report, /4 of 5 file\(s\) downloaded/);
    assert.match(r.report, /## Media to fetch by hand[\s\S]*media\/2024\/05\/dock\.jpg.*HTTP 404/);
    assert.match(r.read('content/posts/hello-world.md'), /\[about us\]\(\/about\/\)/, 'links still rewrite on a non-default host');
  } finally {
    server.close();
  }
});

test('--no-media rewrites references without fetching anything', async () => {
  const r = await run('nomedia', ['--no-media']);
  assert.ok(!r.has('media'), 'no media folder');
  assert.match(r.read('content/posts/hello-world.md'), /\/media\/2024\/05\/lake-1024x768\.jpg/);
  assert.match(r.report, /none fetched \(`--no-media`\)/);
  assert.match(r.report, /media\/2024\/05\/dock\.jpg/);
});

test('the same export always produces the same files', async () => {
  const a = await run('det-a', uploadsArgs);
  const b = await run('det-b', uploadsArgs);
  const list = (dir) => fs.readdirSync(dir, { recursive: true }).filter((f) => fs.statSync(path.join(dir, f)).isFile()).sort();
  assert.deepEqual(list(a.out), list(b.out));
  for (const f of list(a.out).filter((f) => f !== 'MIGRATION-REPORT.md')) {
    assert.equal(a.read(f), b.read(f), `${f} is deterministic`);
  }
});

test('a file that is not a WordPress export gets a plain-language error', async () => {
  fs.mkdirSync(tmp, { recursive: true });
  const notWxr = path.join(tmp, 'feed.xml');
  fs.writeFileSync(notWxr, '<?xml version="1.0"?><rss version="2.0"><channel><title>x</title></channel></rss>');
  await assert.rejects(execFileAsync('node', [importer, notWxr, path.join(tmp, 'bad')]), (err) => {
    assert.match(err.stderr, /doesn't look like a WordPress export/);
    assert.match(err.stderr, /Tools → Export/);
    return true;
  });
  await assert.rejects(execFileAsync('node', [importer]), (err) => /Usage:/.test(err.stderr));
});

// ---------------------------------------------------------------------------
// Regression tests from the adversarial review. Each builds a tiny export in
// code so the case it guards is readable right here.
// ---------------------------------------------------------------------------

const HOST = 'https://edge.example.test';

/** One <item>. Fields default to a published post; pass overrides. */
function item(f) {
  const o = { type: 'post', status: 'publish', date: '2024-05-06 10:00:00', link: `${HOST}/${f.name}/`, content: '', terms: '', meta: {}, parent: 0, ...f };
  const meta = Object.entries(o.meta).map(([k, v]) => `<wp:postmeta><wp:meta_key><![CDATA[${k}]]></wp:meta_key><wp:meta_value><![CDATA[${v}]]></wp:meta_value></wp:postmeta>`).join('');
  return `<item><title><![CDATA[${o.title ?? o.name}]]></title><link>${o.link}</link><dc:creator><![CDATA[ada]]></dc:creator>
<content:encoded><![CDATA[${o.content}]]></content:encoded><excerpt:encoded><![CDATA[]]></excerpt:encoded>
<wp:post_id>${o.id}</wp:post_id><wp:post_date><![CDATA[${o.date}]]></wp:post_date><wp:post_name><![CDATA[${o.name}]]></wp:post_name>
<wp:status><![CDATA[${o.status}]]></wp:status><wp:post_parent>${o.parent}</wp:post_parent><wp:post_type><![CDATA[${o.type}]]></wp:post_type>
<wp:post_password><![CDATA[]]></wp:post_password>${o.attachmentUrl ? `<wp:attachment_url><![CDATA[${o.attachmentUrl}]]></wp:attachment_url>` : ''}${o.terms}${meta}</item>`;
}
const term = (domain, slug, name) => `<category domain="${domain}" nicename="${slug}"><![CDATA[${name}]]></category>`;

/** Write an export (head = extra channel elements) and run the importer on it. */
async function runEdge(name, items, { head = '', args = ['--no-media'], prolog = '<?xml version="1.0" encoding="UTF-8" ?>' } = {}) {
  fs.mkdirSync(tmp, { recursive: true });
  const file = path.join(tmp, `${name}.xml`);
  fs.writeFileSync(file, `${prolog}
<rss version="2.0" xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:wp="http://wordpress.org/export/1.2/">
<channel><title>Edge</title><link>${HOST}</link><wp:wxr_version>1.2</wp:wxr_version><wp:base_site_url>${HOST}</wp:base_site_url><wp:base_blog_url>${HOST}</wp:base_blog_url>
${head}${items.join('\n')}</channel></rss>`);
  return run(name, args, file);
}

/** Render an imported item's body with plain's own Markdown renderer. */
async function render(md) {
  const { renderMarkdown } = await import('../lib/markdown.js');
  return renderMarkdown(md.replace(/^---[\s\S]*?\n---\n/, ''));
}

test('escaped HTML in prose stays text — it never becomes a live tag', async () => {
  const r = await runEdge('escaped-html', [item({ id: 1, name: 'tags', content: '<!-- wp:paragraph --><p>Put the &lt;script&gt; tag before &lt;/body&gt;, write &amp;copy; for ©, and a &lt; b.</p><!-- /wp:paragraph -->\n\nClassic &lt;iframe src="x"&gt; text.' })]);
  const html = await render(r.read('content/posts/tags.md'));
  assert.doesNotMatch(html, /<script|<\/body>|<iframe/, 'no live tags');
  assert.match(html, /&lt;script&gt; tag before &lt;\/body&gt;/);
  assert.match(html, /&amp;copy; for ©/, 'a literal entity stays literal');
});

test('Gutenberg footnotes keep their text', async () => {
  const notes = JSON.stringify([{ id: 'f1', content: 'At sea level, per <a href="https://example.com/src">the source</a>.' }]);
  const r = await runEdge('footnotes', [item({ id: 1, name: 'boil', meta: { footnotes: notes },
    content: '<!-- wp:paragraph --><p>Water boils at 100 °C<sup data-fn="f1" class="fn"><a href="#f1" id="f1-link">1</a></sup>.</p><!-- /wp:paragraph -->\n<!-- wp:footnotes /-->' })]);
  const md = r.read('content/posts/boil.md');
  assert.match(md, /100 °C<sup>1<\/sup>\./, 'marker kept as a superscript');
  assert.match(md, /---\n\n1\. At sea level, per \[the source\]\(https:\/\/example\.com\/src\)\./, 'note text appended');
  assert.doesNotMatch(r.report, /nothing to import: footnotes/);
});

test('redirect keys without a trailing slash never overwrite a live page', async () => {
  const r = await runEdge('no-slash', [
    item({ id: 1, type: 'page', name: 'blog', link: `${HOST}/blog` }),
    item({ id: 2, type: 'page', name: 'about', link: `${HOST}/about` }),
    item({ id: 3, name: 'about', title: 'About this blog', link: `${HOST}/about-post` }),
    item({ id: 4, name: 'hello', link: `${HOST}/hello` }),
  ]);
  const redirects = r.json('data/redirects.json');
  assert.equal(redirects['/blog'], undefined, 'the blog list is plain’s');
  assert.equal(redirects['/about'], undefined, '/about → /about/ is the same page');
  assert.equal(redirects['/hello'], '/blog/hello/');
  assert.equal(redirects['/about-post'], '/blog/about/');
});

test('a top-level page keeps its URL even when a same-named child page comes first', async () => {
  const r = await runEdge('slug-order', [
    item({ id: 1, type: 'page', name: 'services' }),
    item({ id: 2, type: 'page', name: 'team', parent: 1, link: `${HOST}/services/team/` }),
    item({ id: 3, type: 'page', name: 'team' }),
  ]);
  assert.match(r.read('content/pages/team.md'), /title: team/);
  assert.ok(r.has('content/pages/services-team.md'));
  assert.equal(r.json('data/redirects.json')['/services/team/'], '/services-team/');
});

test('tags: look-alike and non-Latin names get their own pages; localized "Uncategorized" is not a tag', async () => {
  const r = await runEdge('tags-collide', [
    item({ id: 1, name: 'cpp', terms: term('post_tag', 'c-2', 'C++') + term('post_tag', 'c', 'C') + term('category', 'allgemein', 'Allgemein') }),
    item({ id: 2, name: 'ru', terms: term('post_tag', '%d1%82%d0%b5%d0%b3', 'Тег') + term('category', 'r-d', 'R&amp;D') }),
  ], { head: `<wp:category><wp:term_id>9</wp:term_id><wp:category_nicename><![CDATA[r-d]]></wp:category_nicename><wp:category_parent><![CDATA[]]></wp:category_parent><wp:cat_name><![CDATA[R&amp;D]]></wp:cat_name></wp:category>` });
  const cpp = parseFrontmatter(r.read('content/posts/cpp.md')).data.tags;
  assert.equal(cpp.length, 2, 'C++ and C both kept');
  assert.notEqual(slugifyLike(cpp[0]), slugifyLike(cpp[1]), 'on different tag pages');
  assert.ok(cpp.includes('C'), '"C" (WordPress slug c) keeps its own name and /blog/tag/c/');
  assert.ok(!cpp.includes('Allgemein'), 'localized default category skipped');
  const ru = parseFrontmatter(r.read('content/posts/ru.md')).data.tags;
  assert.ok(ru.every((t) => slugifyLike(t) !== ''), 'every tag has a usable address');
  assert.ok(ru.includes('R&D'), 'header entities decoded');
  assert.equal(r.json('data/redirects.json')['/category/r-d/'], '/blog/tag/r-d/');
  assert.ok(!Object.values(r.json('data/redirects.json')).some((to) => to.includes('//')), 'no /blog/tag// targets');
  assert.match(r.report, /distinguishing label/);
});
const slugifyLike = (t) => String(t).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

test('hard breaks never turn text into lists, headings or stray backslashes', async () => {
  const r = await runEdge('breaks', [item({ id: 1, name: 'br',
    content: '<!-- wp:paragraph --><p>Shopping:<br>- milk<br>1. eggs<br># not a heading<br></p><!-- /wp:paragraph --><h2>Two<br>lines</h2><ol start="5"><li>five</li><li>six</li></ol><ul><li>a</li></ul><ul><li>b</li></ul><p><strong>Done.</strong>Next</p>' })]);
  const html = await render(r.read('content/posts/br.md'));
  assert.doesNotMatch(html, /<li>milk|<h1>|\\<\/p>/, 'no accidental blocks or trailing backslash');
  assert.match(html, /<h2[^>]*>Two lines<\/h2>/, 'a <br> in a heading becomes a space');
  assert.match(html, /<ol start="5">/, 'ordered lists keep their start');
  assert.equal((html.match(/<ul>/g) || []).length, 2, 'adjacent lists stay separate');
  assert.match(html, /<strong>Done\.<\/strong>Next/, 'emphasis next to punctuation still renders');
});

test('classic <pre> keeps its <br> line breaks', async () => {
  const r = await runEdge('pre-br', [item({ id: 1, name: 'code', content: 'Intro\n<pre>line one<br />line two</pre>\nOutro' })]);
  assert.match(r.read('content/posts/code.md'), /```\nline one\nline two\n```/);
});

test('media: soft-404 pages are never saved as images; ?w= resizes fetch the original', async () => {
  const server = http.createServer((req, res) => {
    const p = new URL(req.url, 'http://x');
    if (p.pathname === '/wp-content/uploads/2024/05/gone.jpg') { res.writeHead(200, { 'content-type': 'text/html' }); res.end('<html>home</html>'); return; }
    res.writeHead(200, { 'content-type': 'image/jpeg' });
    res.end(p.search ? 'thumbnail' : 'original');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    fs.mkdirSync(tmp, { recursive: true });
    const file = path.join(tmp, 'soft404.xml');
    fs.writeFileSync(file, `<?xml version="1.0"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:wp="http://wordpress.org/export/1.2/"><channel><link>${base}</link><wp:base_site_url>${base}</wp:base_site_url>
${item({ id: 1, name: 'p', link: `${base}/p/`, content: `<p><img src="${base}/wp-content/uploads/2024/05/pic.jpg?w=300" alt=""><img src="${base}/wp-content/uploads/2024/05/gone.jpg" alt=""><a href="${base}/wp-content/uploads/2024/05/">folder</a></p>` })}</channel></rss>`);
    const r = await run('soft404', ['--delay=0'], file);
    assert.equal(r.read('media/2024/05/pic.jpg'), 'original');
    assert.ok(!r.has('media/2024/05/gone.jpg'), 'the HTML page was not saved');
    assert.match(r.report, /gone\.jpg.*web page instead of the file/);
  } finally {
    server.close();
  }
});

test('a split export (several .xml files) imports as one site', async () => {
  fs.mkdirSync(tmp, { recursive: true });
  const head = `<?xml version="1.0"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:wp="http://wordpress.org/export/1.2/"><channel><link>${HOST}</link>`;
  const a = path.join(tmp, 'split-1.xml');
  const b = path.join(tmp, 'split-2.xml');
  fs.writeFileSync(a, `${head}${item({ id: 1, name: 'one', link: `${HOST}/2024/one/` })}</channel></rss>`);
  fs.writeFileSync(b, `${head}${item({ id: 2, name: 'two', link: `${HOST}/2024/two/` })}</channel></rss>`);
  const out = path.join(tmp, 'split');
  fs.rmSync(out, { recursive: true, force: true });
  await execFileAsync('node', [importer, a, b, out, '--no-media']);
  const redirects = JSON.parse(fs.readFileSync(path.join(out, 'data', 'redirects.json'), 'utf8'));
  assert.equal(redirects['/2024/one/'], '/blog/one/');
  assert.equal(redirects['/2024/two/'], '/blog/two/');
});

test('an ISO-8859-1 export keeps its accents', async () => {
  fs.mkdirSync(tmp, { recursive: true });
  const file = path.join(tmp, 'latin1.xml');
  const xml = `<?xml version="1.0" encoding="ISO-8859-1"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:wp="http://wordpress.org/export/1.2/"><channel><link>${HOST}</link>${item({ id: 1, name: 'cafe', title: 'Café crème' })}</channel></rss>`;
  fs.writeFileSync(file, Buffer.from(xml, 'latin1'));
  const r = await run('latin1', ['--no-media'], file);
  assert.match(r.read('content/posts/cafe.md'), /title: Café crème/);
});

test('CLI guards: zip files, folders, unknown flags, and "--uploads DIR" with a space', async () => {
  fs.mkdirSync(tmp, { recursive: true });
  const zip = path.join(tmp, 'export.xml');
  fs.writeFileSync(zip, Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0]));
  await assert.rejects(execFileAsync('node', [importer, zip]), (e) => /\.zip archive\. Unzip it first/.test(e.stderr));
  await assert.rejects(execFileAsync('node', [importer, fixtures]), (e) => /is a folder/.test(e.stderr));
  await assert.rejects(execFileAsync('node', [importer, path.join(fixtures, 'export.xml'), '--no-medai']), (e) => /Unknown option/.test(e.stderr));
  const out = path.join(tmp, 'space-flag');
  fs.rmSync(out, { recursive: true, force: true });
  await execFileAsync('node', [importer, path.join(fixtures, 'export.xml'), out, '--uploads', path.join(fixtures, 'uploads')]);
  assert.match(fs.readFileSync(path.join(out, 'MIGRATION-REPORT.md'), 'utf8'), /copied from your uploads folder/);
});

test('no static front page: the report says what to do about the home page', async () => {
  const r = await runEdge('no-front', [item({ id: 1, name: 'only-post' })]);
  assert.match(r.report, /### `content\/pages\/index\.md`\n- Your WordPress home page listed your latest posts/);
});

// ---- second review round ----------------------------------------------------

test('emphasis ending in a line break, awkward alt text, emails and URLs before breaks all render cleanly', async () => {
  const r = await runEdge('inline-edges', [item({ id: 1, name: 'edges', content:
    '<!-- wp:paragraph --><p><strong>Ingredients<br></strong>flour, water</p><!-- /wp:paragraph -->'
    + '<p><img src="https://cdn.example.org/IMG_1234.jpg" alt="IMG_1234 shot [beta] &lt;3"></p>'
    + '<p>Mail first_last@example.com or see https://example.com/page<br>Next line, and &lt;https://example.com/c&gt; too.</p>'
    + '<p><a href="https://example.com/">Read more<br>about it</a></p>'
    + '<ol reversed><li>three</li><li>two</li></ol><ol start="0"><li>zero</li></ol>'
    + '<h2><strong>Bold:</strong> the 1<sup>st</sup></h2>' })]);
  const html = await render(r.read('content/posts/edges.md'));
  assert.match(html, /<strong>Ingredients<\/strong><br>\s*flour/, 'bold closes before the break');
  assert.doesNotMatch(html, /\*\*|\\</, 'no literal markers or backslashes');
  assert.match(html, /alt="IMG_1234 shot \[beta\] &lt;3"/, 'alt text verbatim');
  assert.match(html, /mailto:first_last@example\.com/, 'email intact');
  assert.match(html, /href="https:\/\/example\.com\/page"/, 'URL before a break links correctly');
  assert.match(html, /href="https:\/\/example\.com\/c"/, 'URL before ">" links correctly');
  assert.match(html, /<a href="https:\/\/example\.com\/"[^>]*>Read more about it<\/a>/, 'link text with a break stays a link');
  assert.match(html, /<ol reversed>/, 'reversed list kept as HTML');
  assert.match(html, /<ol start="0">/, 'start="0" kept');
  assert.match(html, /<h2 id="bold-the-1st">Bold: the 1st<\/h2>/, 'heading: no tag names in text or id');
});

test('drafts never block a published redirect or take its slug; a /Blog/ or /About/ key in any case can’t overwrite a page', async () => {
  const r = await runEdge('draft-live', [
    item({ id: 1, type: 'page', name: 'contact', status: 'private', link: `${HOST}/?page_id=1` }),
    item({ id: 2, name: 'contact', link: `${HOST}/contact/` }),
    item({ id: 3, name: '', title: 'Hello', status: 'draft', link: `${HOST}/?p=3` }),
    item({ id: 4, name: 'hello', link: `${HOST}/2024/hello/` }),
    item({ id: 5, type: 'page', name: 'about', link: `${HOST}/About/` }),
    item({ id: 6, type: 'page', name: 'blog', link: `${HOST}/Blog/`, content: '<p>Real text</p>' }),
  ]);
  const redirects = r.json('data/redirects.json');
  assert.equal(redirects['/contact/'], '/blog/contact/', 'a private page doesn’t block the published post’s redirect');
  assert.equal(redirects['/2024/hello/'], '/blog/hello/', 'the published post keeps the plain slug');
  assert.ok(r.has('content/posts/hello-2.md'), 'the draft takes -2');
  assert.equal(redirects['/About/'], undefined, '/About/ and /about/ are one folder on macOS — no self-redirect');
  assert.equal(redirects['/Blog/'], undefined, '/Blog/ can never replace the blog list');
});

test('unsafe archive keys ("..", spaces) never reach the redirect map', async () => {
  const r = await runEdge('dot-keys', [item({ id: 1, name: 'p', terms: term('category', '%2e%2e', 'Dots') }), item({ id: 2, name: 'q', link: `${HOST}/my%20post/` })],
    { head: `<wp:category><wp:term_id>3</wp:term_id><wp:category_nicename><![CDATA[%2e%2e]]></wp:category_nicename><wp:category_parent><![CDATA[]]></wp:category_parent><wp:cat_name><![CDATA[Dots]]></wp:cat_name></wp:category>
<wp:author><wp:author_login><![CDATA[..]]></wp:author_login></wp:author>` });
  for (const from of Object.keys(r.json('data/redirects.json'))) {
    assert.ok(!from.split('/').includes('..') && !/\s|%20/.test(from), `${from} is safe`);
  }
  assert.match(r.report, /my%20post|my post/, 'the dropped key is reported');
});

test('the Posts page: menus and links that pointed at it go to /blog/', async () => {
  const menu = `<item><title><![CDATA[Blog]]></title><wp:post_id>9</wp:post_id><wp:status><![CDATA[publish]]></wp:status><wp:post_type><![CDATA[nav_menu_item]]></wp:post_type><category domain="nav_menu" nicename="main"><![CDATA[Main]]></category>
<wp:postmeta><wp:meta_key><![CDATA[_menu_item_type]]></wp:meta_key><wp:meta_value><![CDATA[post_type]]></wp:meta_value></wp:postmeta><wp:postmeta><wp:meta_key><![CDATA[_menu_item_object_id]]></wp:meta_key><wp:meta_value><![CDATA[3]]></wp:meta_value></wp:postmeta><wp:postmeta><wp:meta_key><![CDATA[_menu_item_menu_item_parent]]></wp:meta_key><wp:meta_value><![CDATA[0]]></wp:meta_value></wp:postmeta></item>
<item><title><![CDATA[Shop]]></title><wp:post_id>10</wp:post_id><wp:status><![CDATA[publish]]></wp:status><wp:post_type><![CDATA[nav_menu_item]]></wp:post_type><category domain="nav_menu" nicename="main"><![CDATA[Main]]></category>
<wp:postmeta><wp:meta_key><![CDATA[_menu_item_type]]></wp:meta_key><wp:meta_value><![CDATA[post_type_archive]]></wp:meta_value></wp:postmeta><wp:postmeta><wp:meta_key><![CDATA[_menu_item_object]]></wp:meta_key><wp:meta_value><![CDATA[product]]></wp:meta_value></wp:postmeta><wp:postmeta><wp:meta_key><![CDATA[_menu_item_menu_item_parent]]></wp:meta_key><wp:meta_value><![CDATA[0]]></wp:meta_value></wp:postmeta></item>`;
  const r = await runEdge('posts-page', [
    item({ id: 3, type: 'page', name: 'blog', title: 'Blog', link: `${HOST}/blog/` }),
    item({ id: 4, name: 'p', content: `<p>See <a href="${HOST}/blog/">all posts</a>.</p>` }),
    menu,
  ]);
  assert.deepEqual(r.json('data/navigation.json'), [{ label: 'Blog', url: '/blog/' }], 'the shop archive is not mapped to the blog');
  assert.match(r.read('content/posts/p.md'), /\[all posts\]\(\/blog\/\)/);
});

test('CLI: boolean flags reject values; split runs into one folder are refused; different sites are refused; output may end in .xml', async () => {
  const exp = path.join(fixtures, 'export.xml');
  await assert.rejects(execFileAsync('node', [importer, exp, path.join(tmp, 'x'), '--no-media=true']), (e) => /takes no value/.test(e.stderr));
  const out = path.join(tmp, 'site.xml');
  fs.rmSync(out, { recursive: true, force: true });
  await execFileAsync('node', [importer, exp, out, '--no-media']);
  assert.ok(fs.existsSync(path.join(out, 'MIGRATION-REPORT.md')), 'a new folder named *.xml is the output');
  await execFileAsync('node', [importer, exp, out, '--no-media']);   // rerunning the same file is fine
  const other = path.join(tmp, 'other.xml');
  fs.writeFileSync(other, `<?xml version="1.0"?><rss version="2.0" xmlns:wp="http://wordpress.org/export/1.2/"><channel><link>https://elsewhere.test</link>${item({ id: 1, name: 'z', link: 'https://elsewhere.test/z/' })}</channel></rss>`);
  await assert.rejects(execFileAsync('node', [importer, other, out, '--no-media']), (e) => /already holds an import/.test(e.stderr));
  await assert.rejects(execFileAsync('node', [importer, exp, other, path.join(tmp, 'mixed'), '--no-media']), (e) => /different sites/.test(e.stderr));
});

// ---- round-three regressions --------------------------------------------------

const menuItem = (id, objectId, title = '') => `<item><title><![CDATA[${title}]]></title><wp:post_id>${id}</wp:post_id><wp:status><![CDATA[publish]]></wp:status><wp:post_type><![CDATA[nav_menu_item]]></wp:post_type><category domain="nav_menu" nicename="primary"><![CDATA[Primary Menu]]></category>
<wp:postmeta><wp:meta_key><![CDATA[_menu_item_type]]></wp:meta_key><wp:meta_value><![CDATA[post_type]]></wp:meta_value></wp:postmeta><wp:postmeta><wp:meta_key><![CDATA[_menu_item_object_id]]></wp:meta_key><wp:meta_value><![CDATA[${objectId}]]></wp:meta_value></wp:postmeta><wp:postmeta><wp:meta_key><![CDATA[_menu_item_menu_item_parent]]></wp:meta_key><wp:meta_value><![CDATA[0]]></wp:meta_value></wp:postmeta></item>`;

test('a stray "<" in classic prose is text, never the start of a tag', async () => {
  const r = await runEdge('stray-lt', [item({ id: 1, name: 'tips', content: "If the bill is < €20, tip nothing; if more than > €50 round up.\n\nI <3 this city.\n\nBefore. If x < 5 and it's late, go home.\n\n<strong>Bold</strong> after.\n\nFinal paragraph here." })]);
  const html = await render(r.read('content/posts/tips.md'));
  assert.match(html, /bill is &lt; €20, tip nothing; if more than &gt; €50 round up\./);
  assert.match(html, /I &lt;3 this city\./);
  assert.match(html, /If x &lt; 5 and it(?:'|&#39;)s late, go home\./);
  assert.match(html, /<strong>Bold<\/strong> after\./, 'later markup still parses');
  assert.doesNotMatch(html, /&lt;\/?p&gt;|&lt;strong/, 'no markup shown as text');
  assert.match(html, /Final paragraph here\./);
});

test('thousands of unclosed tags never overflow the stack', async () => {
  const lines = Array.from({ length: 4000 }, (_, i) => `<font face="Arial">line ${i}`).join('\n');
  const r = await runEdge('deep', [item({ id: 1, name: 'deep', content: lines })]);
  assert.match(r.read('content/posts/deep.md'), /line 3999/);
});

test('Jetpack embeds and button shortcodes keep their addresses; captions and verse survive', async () => {
  const r = await runEdge('shortcodes', [item({ id: 1, name: 'embeds', content: [
    'Follow-up: [youtube https://www.youtube.com/watch?v=oHg5SJYRHA0]',
    '[vimeo 123456]',
    '[tweet https://twitter.com/jane/status/1]',
    '[instagram url=https://www.instagram.com/p/BfAbCdEf123/]',
    '[soundcloud url="https://api.soundcloud.com/tracks/123456" params="color=ff5500" /]',
    '[su_button url="https://books.example.test/paris"]Get my e-book[/su_button]',
    '[mystery_widget url="https://widgets.example.test/a"]',
  ].join('\n\n') }), item({ id: 2, name: 'blocks', content: [
    '<!-- wp:embed {"url":"https://www.youtube.com/watch?v=abcdefghijk"} --><figure class="wp-block-embed is-type-video"><div class="wp-block-embed__wrapper">\nhttps://www.youtube.com/watch?v=abcdefghijk\n</div><figcaption class="wp-element-caption">My drone footage over Arashiyama (4K).</figcaption></figure><!-- /wp:embed -->',
    '<!-- wp:verse --><pre class="wp-block-verse">An old silent pond<br>A frog jumps into the pond—\n<em>Splash!</em> Silence again.</pre><!-- /wp:verse -->',
    '<!-- wp:table --><figure class="wp-block-table"><table><thead><tr><th colspan="2">Prices</th></tr></thead><tbody><tr><td>Tea</td><td>€2</td></tr><tr><td>Coffee</td><td>€3</td></tr></tbody></table></figure><!-- /wp:table -->',
  ].join('\n') })]);
  const md = r.read('content/posts/embeds.md');
  for (const url of ['https://www.youtube.com/watch?v=oHg5SJYRHA0', 'https://vimeo.com/123456', 'https://twitter.com/jane/status/1', 'https://www.instagram.com/p/BfAbCdEf123/', 'https://api.soundcloud.com/tracks/123456']) {
    assert.ok(md.includes(`](${url})`), `${url} kept as a link`);
  }
  assert.match(md, /\[Get my e-book\]\(https:\/\/books\.example\.test\/paris\)/, 'a button becomes a link');
  assert.match(r.report, /mystery_widget[\s\S]*https:\/\/widgets\.example\.test\/a/, 'a removed shortcode’s address is in the report');
  const blocks = await render(r.read('content/posts/blocks.md'));
  assert.match(blocks, /My drone footage over Arashiyama \(4K\)\./, 'embed caption kept');
  assert.doesNotMatch(blocks, /<pre|<code/, 'a poem is not code');
  assert.match(blocks, /An old silent pond<br>\s*A frog jumps into the pond—<br>\s*<em>Splash!<\/em> Silence again\./);
  assert.match(blocks, /<th colspan="2">Prices<\/th>[\s\S]*€2[\s\S]*€3/, 'a merged-cell table keeps every cell');
});

test('the Posts page by id: links and an untitled menu entry go to /blog/, no crash', async () => {
  const r = await runEdge('posts-page-id', [
    item({ id: 5, type: 'page', name: 'blog', title: 'Journal', link: `${HOST}/blog/` }),
    item({ id: 6, type: 'page', name: 'about', link: `${HOST}/about/` }),
    item({ id: 7, name: 'old', content: `<p>See <a href="${HOST}/?page_id=5">all posts</a>.</p>` }),
    menuItem(20, 5), menuItem(21, 6),
  ]);
  assert.match(r.read('content/posts/old.md'), /\[all posts\]\(\/blog\/\)/);
  assert.deepEqual(r.json('data/navigation.json'), [{ label: 'Journal', url: '/blog/' }, { label: 'about', url: '/about/' }]);
  assert.doesNotMatch(r.report, /doesn't include/);
});

test('line separators in titles and tags never break the frontmatter; long draft titles make short filenames', async () => {
  const long = 'Notes from the annual general meeting '.repeat(8).trim();
  const r = await runEdge('separators', [
    item({ id: 1, name: 'spring', title: 'Spring menu now served', terms: term('post_tag', 'recipes', 'Recipes\rMains') }),
    item({ id: 2, name: '', status: 'draft', title: long, link: `${HOST}/?p=2` }),
  ]);
  const { data } = parseFrontmatter(r.read('content/posts/spring.md'), 'spring.md');
  assert.equal(data.title, 'Spring menu now served');
  assert.deepEqual(data.tags, ['Recipes Mains']);
  const draft = fs.readdirSync(path.join(r.out, 'content', 'posts')).find((f) => f.startsWith('notes-'));
  assert.ok(draft && draft.length <= 84, `short filename (${draft})`);
});

test('a draft at an address a redirect still uses is told to remove that redirect', async () => {
  const r = await runEdge('draft-redirect', [
    item({ id: 1, name: 'newsletter', link: `${HOST}/newsletter/` }),
    item({ id: 2, type: 'page', name: '', title: 'Newsletter', status: 'draft', link: `${HOST}/?page_id=2` }),
  ]);
  assert.equal(r.json('data/redirects.json')['/newsletter/'], '/blog/newsletter/', 'the published post keeps its redirect');
  assert.match(r.report, /content\/pages\/newsletter\.md[\s\S]*remove that line/);
});

test('media: case clashes, a clash with a real "-2" file, and multisite paths stay separate files', async () => {
  const img = (p) => `<img src="${HOST}/wp-content/uploads/${p}" alt="">`;
  const r = await runEdge('media-names', [item({ id: 1, name: 'pics', content: `<p>${img('2024/05/photo.jpg')} ${img('2024/05/photo.JPG')} ${img('2024/05/photo-2.JPG')} ${img('sites/2/2024/05/logo.png')} ${img('2024/05/logo.png')}</p>` })]);
  const srcs = [...r.read('content/posts/pics.md').matchAll(/\]\((\/media\/[^)]+)\)/g)].map((m) => m[1]);
  assert.equal(srcs.length, 5);
  assert.equal(new Set(srcs.map((s) => s.toLowerCase())).size, 5, `five distinct files: ${srcs.join(', ')}`);
});

test('old WordPress.com image addresses: this site’s old host is fetched; another blog’s is reported, never swapped', async () => {
  const r = await runEdge('wpcom-hotlink', [
    item({ id: 9, type: 'attachment', name: 'padthai', attachmentUrl: `${HOST}/wp-content/uploads/2018/02/padthai.jpg` }),
    item({ id: 10, type: 'attachment', name: 'image', attachmentUrl: `${HOST}/wp-content/uploads/2015/03/image.jpg` }),
    item({ id: 1, name: 'food', content: '<p><img src="https://wander.files.wordpress.com/2018/02/padthai.jpg?w=640" alt="Pad thai"> <img src="https://wander.files.wordpress.com/2017/01/other.jpg" alt="Other"> <img src="https://someoneelse.files.wordpress.com/2015/03/image.jpg" alt="Theirs"></p>' }),
  ]);
  const md = r.read('content/posts/food.md');
  assert.match(md, /!\[Pad thai\]\(\/media\/2018\/02\/padthai\.jpg\)/);
  assert.match(md, /!\[Other\]\(\/media\/2017\/01\/other\.jpg\)/, 'the site’s own old host: every file imported');
  assert.match(md, /!\[Theirs\]\(https:\/\/someoneelse\.files\.wordpress\.com\/2015\/03\/image\.jpg\)/, 'never replaced by our own image.jpg');
  assert.match(r.report, /still load from another site.s WordPress uploads[\s\S]*someoneelse\.files\.wordpress\.com/);
});

test('headings: "<" and superscripts don’t leak into the anchor id; a URL before "]" links exactly', async () => {
  const r = await runEdge('heading-ids', [item({ id: 1, name: 'h', content: '<!-- wp:heading --><h2>a &lt; b<sup>2</sup></h2><!-- /wp:heading --><!-- wp:paragraph --><p>[see https://example.com/x]</p><!-- /wp:paragraph -->' })]);
  const html = await render(r.read('content/posts/h.md'));
  assert.match(html, /<h2 id="a-b2">a &lt; b²<\/h2>/);
  assert.match(html, /\[see <a href="https:\/\/example\.com\/x"[^>]*>https:\/\/example\.com\/x<\/a>\]/);
});

test('CLI: an existing non-export file in the last place gets a hint about the output folder', async () => {
  const notes = path.join(tmp, 'notes.txt');
  fs.mkdirSync(tmp, { recursive: true });
  fs.writeFileSync(notes, 'hello');
  await assert.rejects(execFileAsync('node', [importer, path.join(fixtures, 'export.xml'), notes]), (e) => /already exists as a file/.test(e.stderr));
});

// ---- round-four regressions ---------------------------------------------------

test('"n<k it\'s" in classic prose never swallows the rest of the post', async () => {
  const r = await runEdge('lt-letter', [item({ id: 1, name: 'math', content: "When n<k it's fine.\n\nDon't panic.\n\nNext <strong>bold</strong> paragraph.\n\n<h2>Heading</h2>\n\nUse x<y and a stray </z too." })]);
  const html = await render(r.read('content/posts/math.md'));
  assert.match(html, /When n&lt;k it(?:'|&#39;)s fine\./);
  assert.match(html, /Don(?:'|&#39;)t panic\./);
  assert.match(html, /Next <strong>bold<\/strong> paragraph\./);
  assert.match(html, /<h2 id="heading">Heading<\/h2>/);
  assert.match(html, /x&lt;y and a stray &lt;\/z too\./);
});

test('verse keeps its indents; every other <pre> stays code, formatting or not', async () => {
  const r = await runEdge('pre-kinds', [item({ id: 1, name: 'pre', content: [
    '<!-- wp:verse --><pre class="wp-block-verse">The sea,\n    the sea,</pre><!-- /wp:verse -->',
    '<!-- wp:html --><pre class="brush: bash">$ <b>npm</b> install\n    nested</pre><!-- /wp:html -->',
    '<!-- wp:html --><pre>def foo():\n    return <b>value</b></pre><!-- /wp:html -->',
  ].join('\n') })]);
  const md = r.read('content/posts/pre.md');
  assert.match(md, /The sea,\\\n&nbsp;&nbsp;&nbsp;&nbsp;the sea,/, 'verse indent kept');
  assert.match(md, /```bash\n\$ npm install\n {4}nested\n```/, 'brush: block is code');
  assert.match(md, /```\ndef foo\(\):\n {4}return value\n```/, 'a <pre> with <b> is still code');
});

test('URLs: brackets inside, curly quotes after, inside link text; "~" is not strikethrough', async () => {
  const r = await runEdge('urls-tilde', [item({ id: 1, name: 'u', content: '<!-- wp:paragraph --><p>See https://api.example.com/items?filter[status]=open&amp;sort=asc now. “https://x.test/z” and <a href="https://x.com">https://x.com/a_</a>. Keep it at 20~25°C, edit ~/.bashrc, and ~~old~~.</p><!-- /wp:paragraph -->' })]);
  const html = await render(r.read('content/posts/u.md'));
  assert.match(html, /href="https:\/\/api\.example\.com\/items\?filter\[status\]=open&amp;sort=asc"/);
  assert.match(html, /href="https:\/\/x\.test\/z"/);
  assert.doesNotMatch(html, /<a [^>]*>[^<]*<a /, 'no link inside a link');
  assert.doesNotMatch(html, /<del>/);
  assert.match(html, /20~25°C, edit ~\/\.bashrc, and ~~old~~\./);
});

test('tables: captions and cell line breaks kept; nested and list-holding tables stay HTML', async () => {
  const r = await runEdge('tables', [item({ id: 1, name: 't', content: [
    '<!-- wp:table --><figure class="wp-block-table"><table><caption>Prices 2024</caption><tbody><tr><td>a<br>b</td><td>c</td></tr><tr><td>d</td><td>e</td></tr></tbody></table></figure><!-- /wp:table -->',
    '<!-- wp:html --><table><tr><td>Left</td><td><table><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></table></td></tr></table><!-- /wp:html -->',
  ].join('\n') })]);
  const html = await render(r.read('content/posts/t.md'));
  assert.match(html, /<t[hd]>a<br>b<\/t[hd]>/);
  assert.match(html, /Prices 2024/);
  assert.equal((html.match(/<td>a<\/td>/g) || []).length, 1, 'nested rows not duplicated');
});

test('heading ids come from the visible text, not a link’s URL', async () => {
  const { renderMarkdown } = await import('../lib/markdown.js');
  assert.match(renderMarkdown('## a [b](https://x.test)'), /<h2 id="a-b">/);
  assert.match(renderMarkdown('## Q&A: it’s here'), /<h2 id="q-a-it-s-here">/);
});

test('shortcode stripper: prose in brackets survives; buttons pair correctly; columns stay apart; one break after <br />', async () => {
  const r = await runEdge('prose-brackets', [item({ id: 1, name: 'p', content: [
    'The effect was large [n = 120], see [p = 0.03] and [Smith].',
    'Press [tab] to indent, then the [code] runs.',
    '[button url="https://example.com/buy" text="Buy now"]',
    'Some text in between.',
    '[button url="https://example.com/b"]Second[/button]',
    '[one_half]Left col[/one_half][one_half]Right col[/one_half]',
    'Roses are red<br />\nViolets are blue',
  ].join('\n\n') })]);
  const md = r.read('content/posts/p.md');
  assert.match(md, /\\\[n = 120\\\], see \\\[p = 0\.03\\\] and \\\[Smith\\\]\./);
  assert.match(md, /Press \\\[tab\\\] to indent, then the \\\[code\\\] runs\./);
  assert.match(md, /\[Buy now\]\(https:\/\/example\.com\/buy\)\n\nSome text in between\.\n\n\[Second\]\(https:\/\/example\.com\/b\)/);
  assert.match(md, /Left col\n\nRight col/);
  assert.match(md, /Roses are red\\\nViolets are blue/);
});

test('menus: untitled entries use the title the page was given; untitled drop-down headings are named by id', async () => {
  const heading = `<item><title><![CDATA[]]></title><wp:post_id>31</wp:post_id><wp:status><![CDATA[publish]]></wp:status><wp:post_type><![CDATA[nav_menu_item]]></wp:post_type><category domain="nav_menu" nicename="primary"><![CDATA[Primary Menu]]></category>
<wp:postmeta><wp:meta_key><![CDATA[_menu_item_type]]></wp:meta_key><wp:meta_value><![CDATA[custom]]></wp:meta_value></wp:postmeta><wp:postmeta><wp:meta_key><![CDATA[_menu_item_url]]></wp:meta_key><wp:meta_value><![CDATA[#]]></wp:meta_value></wp:postmeta><wp:postmeta><wp:meta_key><![CDATA[_menu_item_menu_item_parent]]></wp:meta_key><wp:meta_value><![CDATA[0]]></wp:meta_value></wp:postmeta></item>`;
  const r = await runEdge('menu-untitled', [item({ id: 6, type: 'page', name: 'about', title: '', link: `${HOST}/about/` }), menuItem(30, 6), heading]);
  assert.deepEqual(r.json('data/navigation.json'), [{ label: 'About', url: '/about/' }]);
  assert.match(r.report, /\(untitled, menu item 31\) was only a drop-down heading/);
});

test('the Posts page of WordPress in a subfolder still becomes /blog/', async () => {
  const base = `${HOST}/wp`;
  const file = path.join(tmp, 'subdir.xml');
  fs.mkdirSync(tmp, { recursive: true });
  fs.writeFileSync(file, `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:wp="http://wordpress.org/export/1.2/">
<channel><title>Sub</title><link>${base}</link><wp:wxr_version>1.2</wp:wxr_version><wp:base_site_url>${base}</wp:base_site_url><wp:base_blog_url>${base}</wp:base_blog_url>
${item({ id: 5, type: 'page', name: 'blog', title: 'Blog', link: `${base}/blog/` })}
${item({ id: 7, name: 'p', link: `${base}/p/`, content: `<p><a href="${base}/blog/">all posts</a></p>` })}
${menuItem(20, 5)}</channel></rss>`);
  const r = await run('subdir', ['--no-media'], file);
  assert.ok(!r.has('content/pages/blog-page.md'), 'the empty Posts page is not imported');
  assert.match(r.read('content/posts/p.md'), /\[all posts\]\(\/blog\/\)/);
  assert.deepEqual(r.json('data/navigation.json'), [{ label: 'Blog', url: '/blog/' }]);
  assert.equal(r.json('data/redirects.json')['/wp/blog/'], '/blog/');
});

test('media: one own-site file across http/https/www.; CDN-hosted uploads are imported; used files never counted unused; placeholder comment URLs dropped', async () => {
  const comment = `<wp:comment><wp:comment_id>1</wp:comment_id><wp:comment_author><![CDATA[Bo]]></wp:comment_author><wp:comment_author_url>http://</wp:comment_author_url><wp:comment_date>2024-05-07 10:00:00</wp:comment_date><wp:comment_content><![CDATA[Nice]]></wp:comment_content><wp:comment_approved>1</wp:comment_approved><wp:comment_type></wp:comment_type><wp:comment_parent>0</wp:comment_parent></wp:comment>`;
  const r = await runEdge('media-keys', [
    item({ id: 8, type: 'attachment', name: 'lake', attachmentUrl: 'https://cdn.edge.example.test/wp-content/uploads/2024/05/lake.jpg' }),
    item({ id: 9, type: 'attachment', name: 'a', attachmentUrl: `${HOST}/wp-content/uploads/2024/05/Pic.jpg` }),
    item({ id: 10, type: 'attachment', name: 'b', attachmentUrl: `${HOST}/wp-content/uploads/2024/05/pic.jpg` }),
    item({ id: 1, name: 'm', meta: { _thumbnail_id: '8' }, terms: comment, content: '<p><img src="http://edge.example.test/wp-content/themes/t/badge.png" alt=""> <img src="https://www.edge.example.test/wp-content/themes/t/badge.png" alt=""> <img src="https://cdn.edge.example.test/wp-content/uploads/2024/05/lake-300x200.jpg" alt=""> <img src="https://edge.example.test/wp-content/uploads/2024/05/Pic.jpg" alt=""> <img src="https://edge.example.test/wp-content/uploads/2024/05/pic.jpg" alt=""></p>' }),
  ]);
  const post = r.read('content/posts/m.md');
  assert.equal((post.match(/\/media\/wp-content\/themes\/t\/badge[^)]*\)/g) || []).length, 2);
  assert.ok(!post.includes('badge-2'), 'one file for both addresses');
  assert.match(post, /cover: \/media\/2024\/05\/lake\.jpg/);
  assert.match(post, /\/media\/2024\/05\/lake-300x200\.jpg/);
  assert.doesNotMatch(r.report, /aren't used by any post/);
  assert.deepEqual(Object.keys(r.json('data/comments.json')['/blog/m/'][0]).includes('authorUrl'), false);
});

// ---- round-five regressions ---------------------------------------------------

test('raw HTML tables stay one HTML block: indented source, blank lines, <pre> inside, text right before', async () => {
  const r = await runEdge('raw-tables', [
    item({ id: 1, name: 'g', content: '<!-- wp:html -->\n<table>\n  <tr>\n    <td colspan="2">Title</td>\n  </tr>\n\n    <tr>\n        <td>b _x_</td>\n        <td><pre>a\n\n    b</pre></td>\n    </tr>\n</table>\n<!-- /wp:html -->' }),
    item({ id: 2, name: 'c', content: 'Our prices:\n<table>\n<tr>\n<td colspan="2">Menu</td>\n</tr>\n<tr>\n<td>Tea</td>\n<td>$2</td>\n</tr>\n</table>\nThanks.' }),
  ]);
  const g = await render(r.read('content/posts/g.md'));
  assert.doesNotMatch(g, /&lt;t[rd]|<code>/, 'no markup shown as code');
  assert.match(g, /<td>b _x_<\/td>/);
  const c = r.read('content/posts/c.md');
  assert.doesNotMatch(c, /<table><br>|<\/tr><br>|<\/td><br>/, 'no stray breaks between table tags');
});

test('code blocks keep every blank line; MathML and SVG children stay markup', async () => {
  const r = await runEdge('code-math', [item({ id: 1, name: 'cm', content: '<!-- wp:code --><pre class="wp-block-code"><code>import os\n\n\ndef main():\n    pass</code></pre><!-- /wp:code -->\n<!-- wp:paragraph --><p>Area: <math><msup><mi>r</mi><mn>2</mn></msup></math> done.</p><!-- /wp:paragraph -->' })]);
  const md = r.read('content/posts/cm.md');
  assert.match(md, /import os\n\n\ndef main\(\):/);
  assert.doesNotMatch(md, /&lt;msup/);
});

test('URLs: punctuation before a closing quote, unbalanced "]", www. in quotes, and a URL glued to bold', async () => {
  const r = await runEdge('urls-2', [item({ id: 1, name: 'u2', content: '<!-- wp:paragraph --><p>He wrote “see https://ex.com/a.” and «https://ex.com/b.» then [source: https://ex.com/c]. Visit “www.ex.com” today. x https://ex.com/d<strong>bold</strong></p><!-- /wp:paragraph -->' })]);
  const html = await render(r.read('content/posts/u2.md'));
  for (const u of ['a', 'b', 'c', 'd']) assert.match(html, new RegExp(`href="https://ex\\.com/${u}"`), `/${u} links exactly`);
  assert.match(html, />www\.ex\.com<\/a>/, 'www. keeps its visible text');
  assert.match(html, /<strong>bold<\/strong>/);
});

test('heading ids never repeat, even next to a real "-1" heading', async () => {
  const { renderMarkdown } = await import('../lib/markdown.js');
  const ids = [...renderMarkdown('## Intro\n\n## Intro\n\n## Intro 1').matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, 3, ids.join(', '));
});

test('shortcodes: inline wrappers add no spaces; standalone [toc]/[divider] go; layout variants split into paragraphs', async () => {
  const r = await runEdge('sc-spacing', [
    item({ id: 1, name: 'classic', content: '[dropcap]L[/dropcap]orem ipsum. This is [highlight]important[/highlight], yes.\n\n[toc]\n\nPara one.\n\n[divider]\n\nIntro text.\n[su_divider]\nMore text.\n\n[su_row][su_column size="1/2"]Left half.[/su_column][su_column size="1/2"]Right half.[/su_column][/su_row]' }),
    item({ id: 2, name: 'blocks', content: '<!-- wp:shortcode -->[su_tabs][su_tab title="One"]Tab one.[/su_tab][su_tab title="Two"]Tab two.[/su_tab][/su_tabs]<!-- /wp:shortcode -->' }),
  ]);
  const md = r.read('content/posts/classic.md');
  assert.match(md, /Lorem ipsum\. This is important, yes\./);
  assert.doesNotMatch(md, /toc|divider/);
  assert.match(md, /Left half\.\n\nRight half\./);
  assert.match(r.read('content/posts/blocks.md'), /\*\*One\*\*\n\nTab one\.\n\n\*\*Two\*\*\n\nTab two\./, 'tab labels kept');
});

test('media: an original counts as used when a resized copy is; offloaded media with its own paths is imported', async () => {
  const r = await runEdge('media-3', [
    item({ id: 101, type: 'attachment', name: 'lake', attachmentUrl: `${HOST}/wp-content/uploads/2024/05/lake.jpg` }),
    item({ id: 104, type: 'attachment', name: 'fish', attachmentUrl: 'https://media.example-cdn.net/2024/07/fish.jpg' }),
    item({ id: 1, name: 'm3', meta: { _thumbnail_id: '104' }, content: `<p><img class="wp-image-101" src="${HOST}/wp-content/uploads/2024/05/lake-1024x768.jpg" alt=""> <img src="https://media.example-cdn.net/2024/07/fish-300x200.jpg" alt=""></p>` }),
  ]);
  const md = r.read('content/posts/m3.md');
  assert.match(md, /cover: \/media\/2024\/07\/fish\.jpg/);
  assert.match(md, /\/media\/2024\/07\/fish-300x200\.jpg/);
  assert.doesNotMatch(r.report, /aren't used by any post/);
});

// ---- round-six regressions ----------------------------------------------------

test('classic: a player alone on its line is its own block; <p style> keeps its line breaks; MathML is kept', async () => {
  const r = await runEdge('classic-6', [item({ id: 1, name: 'c6', content: `Here is the recording:\n<audio controls src="${HOST}/wp-content/uploads/2024/05/sermon.mp3"></audio>\nThanks to everyone.\n\n<p style="text-align: center;">Line one\nLine two</p>\n\nThe area is <math><mi>π</mi><msup><mi>r</mi><mn>2</mn></msup></math> units.` })]);
  const html = await render(r.read('content/posts/c6.md'));
  assert.match(html, /<p>Here is the recording:<\/p>\s*(?:<p>)?<audio[^>]*><\/audio>(?:<\/p>)?\s*<p>Thanks to everyone\.<\/p>/);
  assert.match(html, /Line one<br>\s*Line two/);
  assert.match(html, /<math><mi>π<\/mi><msup><mi>r<\/mi><mn>2<\/mn><\/msup><\/math>/);
});

test('URLs: punctuation then markup, and an ellipsis or 。 after a URL, all link exactly', async () => {
  const r = await runEdge('urls-3', [item({ id: 1, name: 'u3', content: '<!-- wp:paragraph --><p>Sources: https://a.test/x,<a href="https://b.test/y">another</a>. Visit https://a.test/p.<strong>Next</strong> step. More at https://a.test/m… and 詳細は https://a.test/j。</p><!-- /wp:paragraph -->' })]);
  const html = await render(r.read('content/posts/u3.md'));
  for (const u of ['x', 'p', 'm', 'j']) assert.match(html, new RegExp(`href="https://a\\.test/${u}"`), `/${u}`);
  assert.match(html, /href="https:\/\/b\.test\/y"[^>]*>another<\/a>/);
  assert.match(html, /<strong>Next<\/strong>/);
});

test('shortcodes: a bare snake_case config header stays; FAQ questions are kept', async () => {
  const r = await runEdge('sc-6', [item({ id: 1, name: 's6', content: '[web_servers]\nweb1.example.test\n\n[su_accordion][su_spoiler title="How long?"]Two days.[/su_spoiler][/su_accordion]' })]);
  const md = r.read('content/posts/s6.md');
  assert.match(md, /\\\[web\\_servers\\\]/);
  assert.match(md, /(?:\*\*|<strong>)How long\?(?:\*\*|<\/strong>)\n\nTwo days\./);
});

test('offloaded media: resized copies come from the bucket; -scaled originals count as used', async () => {
  const r = await runEdge('offload-6', [
    item({ id: 8, type: 'attachment', name: 'fish', attachmentUrl: 'https://bucket.example-cdn.net/2024/05/fish.jpg' }),
    item({ id: 9, type: 'attachment', name: 'big', attachmentUrl: `${HOST}/wp-content/uploads/2024/05/big-scaled.jpg` }),
    item({ id: 1, name: 'o6', content: `<p><img src="${HOST}/wp-content/uploads/2024/05/fish-1024x768.jpg" alt=""> <img src="${HOST}/wp-content/uploads/2024/05/big-1024x683.jpg" alt=""></p>` }),
  ]);
  assert.match(r.report, /fish-1024x768\.jpg[^\n]*https:\/\/bucket\.example-cdn\.net\/2024\/05\/fish-1024x768\.jpg/);
  assert.doesNotMatch(r.report, /aren't used by any post/);
});

// ---- round-seven regressions --------------------------------------------------

test('classic: tags written over several lines, pretty-printed math, a textarea — no <br> inside any of them', async () => {
  const r = await runEdge('classic-7', [item({ id: 1, name: 'c7', content: [
    `Look at this:\n<img src="${HOST}/wp-content/uploads/2024/05/a.jpg"\n     alt="Lake at dawn"\n     width="300" height="200" />\nNice, right?`,
    'See <a\n  href="https://example.com/page"\n  target="_blank"\n  rel="noopener">the docs</a> for more.',
    'The formula:\n\n<math display="block">\n  <mi>x</mi>\n  <mo>=</mo>\n  <mn>2</mn>\n</math>\n\nDone.',
    'Copy this badge code:\n<textarea rows="3">line one\nline two</textarea>\nThanks.',
  ].join('\n\n') })]);
  const html = await render(r.read('content/posts/c7.md'));
  assert.doesNotMatch(html, /width=&quot;|width="300" height="200" \/&gt;|target=&quot;|&lt;br&gt;/);
  assert.match(html, /<img src="\/media\/2024\/05\/a\.jpg" alt="Lake at dawn"/);
  assert.match(html, /<a href="https:\/\/example\.com\/page"[^>]*>the docs<\/a> for more\./);
  assert.doesNotMatch(html, /<math[^>]*>[\s\S]*<br>[\s\S]*<\/math>/, 'no <br> inside the formula');
  assert.match(html, /<textarea rows="3">line one(?:\n|&#10;)line two<\/textarea>/);
  assert.doesNotMatch(html, /\\<\/p>|<p>\\/, 'no stray backslashes');
});

test('CJK and em-dash punctuation end a URL', async () => {
  const r = await runEdge('cjk-url', [item({ id: 1, name: 'cj', content: '<!-- wp:paragraph --><p>官网：https://example.com/。欢迎访问！参见 https://example.com/a、https://example.com/b，还有 See https://example.com/c—it is free.</p><!-- /wp:paragraph -->' })]);
  const html = await render(r.read('content/posts/cj.md'));
  for (const h of ['https://example.com/', 'https://example.com/a', 'https://example.com/b', 'https://example.com/c']) assert.ok(html.includes(`href="${h}"`), h);
});

test('shortcodes: a Shortcode block and bare plugin shortcodes are removed and noted; unknown bracket lines are kept with a note', async () => {
  const r = await runEdge('sc-7', [
    item({ id: 1, type: 'page', name: 'checkout', link: `${HOST}/checkout/`, content: '<!-- wp:shortcode -->\n[woocommerce_checkout]\n<!-- /wp:shortcode -->' }),
    item({ id: 2, name: 'body', content: 'Great post body.\n\n[addtoany]\n\n[jetpack_subscription_form]\n\n[web_servers]\nweb1.example.test' }),
  ]);
  assert.doesNotMatch(r.read('content/pages/checkout.md'), /woocommerce_checkout|woocommerce\\_checkout/);
  const md = r.read('content/posts/body.md');
  assert.doesNotMatch(md, /addtoany|jetpack/);
  assert.match(r.report, /Kept "\[web_servers\]" as text/);
});

test('media: an offloaded "-rotated" original’s resized copy comes from the bucket; a size in the original’s own name still counts as used', async () => {
  const r = await runEdge('media-7', [
    item({ id: 10, type: 'attachment', name: 'phone', attachmentUrl: 'https://bucket.example-cdn.net/2024/05/phone-rotated.jpg' }),
    item({ id: 11, type: 'attachment', name: 'wall', attachmentUrl: `${HOST}/wp-content/uploads/2024/05/wallpaper-1920x1080.jpg` }),
    item({ id: 1, name: 'm7', content: `<p><img src="${HOST}/wp-content/uploads/2024/05/phone-768x1024.jpg" alt=""> <img src="${HOST}/wp-content/uploads/2024/05/wallpaper-1920x1080-300x169.jpg" alt=""></p>` }),
  ]);
  assert.match(r.report, /phone-768x1024\.jpg[^\n]*https:\/\/bucket\.example-cdn\.net\/2024\/05\/phone-768x1024\.jpg/);
  assert.doesNotMatch(r.report, /aren't used by any post/);
});

// ---- round-eight regressions --------------------------------------------------

test('an iframe or textarea inside a paragraph gets its own block; textarea entities are shown once', async () => {
  const r = await runEdge('exotic-8', [
    item({ id: 1, name: 'v', content: 'My trip.\n\n<p style="text-align: center;"><iframe src="https://www.youtube.com/embed/abc" width="560" height="315" allowfullscreen></iframe>\nVideo by <a href="https://john.test/">John</a></p>' }),
    item({ id: 2, name: 'g', content: '<!-- wp:paragraph --><p>Watch this:<br><iframe src="https://y.test/e"></iframe><br>Then <strong>subscribe</strong> to <a href="https://y.test/">my channel</a>.<br>Another line</p><!-- /wp:paragraph -->' }),
    item({ id: 3, name: 't', content: 'Copy the code:\n<textarea rows="3">&lt;script src="x"&gt;&lt;/script&gt;</textarea> and paste it.' }),
  ]);
  const v = await render(r.read('content/posts/v.md'));
  assert.match(v, /<\/iframe>\s*<p>Video by <a href="https:\/\/john\.test\/"[^>]*>John<\/a><\/p>/);
  const g = await render(r.read('content/posts/g.md'));
  assert.match(g, /<p>Then <strong>subscribe<\/strong> to <a href="https:\/\/y\.test\/"[^>]*>my channel<\/a>\. ?<br>\s*Another line<\/p>/);
  assert.doesNotMatch(g, /\*\*|\]\(|\\<\/p>/);
  const t = await render(r.read('content/posts/t.md'));
  assert.match(t, /<textarea rows="3">&lt;script src=&quot;x&quot;&gt;&lt;\/script&gt;<\/textarea>|<textarea rows="3">&lt;script src="x"&gt;&lt;\/script&gt;<\/textarea>/);
  assert.doesNotMatch(t, /&amp;lt;/);
});
