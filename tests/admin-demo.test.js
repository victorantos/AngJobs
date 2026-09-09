// tests/admin-demo.test.js — the demo sandbox (admin/js/demo.js), the "try the
// editor with no account" mode. It stands in for the GitHub REST API with a
// repository that lives in the browser tab, seeded from the site's own
// published JSON API. What matters here: the Markdown it reconstructs is the
// Markdown the editor would have written (no derived fields leaking in), and
// every call the admin makes gets a GitHub-shaped answer — including the 404s.
//
// admin/js/demo.js imports ../lib/content.js, which only exists next to it once
// the build has copied it (build.js `copyAdmin`), so the test assembles that
// same layout in a temp dir and imports the real source files from there.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseFrontmatter } from '../lib/content.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'plain-demo-'));
fs.mkdirSync(path.join(tmp, 'js'));
fs.mkdirSync(path.join(tmp, 'lib'));
for (const file of ['demo.js', 'github.js']) fs.copyFileSync(path.join(root, 'admin', 'js', file), path.join(tmp, 'js', file));
for (const file of ['content.js', 'util.js']) fs.copyFileSync(path.join(root, 'lib', file), path.join(tmp, 'lib', file));
// The temp dir sits outside the repo, so Node finds no package.json above it
// and reads these .js files as CommonJS — the ESM imports then throw before a
// single assertion runs. Declare the module type where the copies live.
fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}\n');

const store = new Map();
globalThis.sessionStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
};

const ITEM = {
  title: 'Hello, world', date: '2026-07-01', tags: ['launch'], draft: false, example: true,
  slug: 'hello-world', url: '/blog/hello-world/', file: 'content/posts/hello-world.md', collection: 'posts',
  body: 'Body **text**.\n\n![A lake](/media/2026/07/lake.jpg)\n',
  dateFormatted: 'July 1, 2026', readingTime: '1 min read', content: '<p>Body <strong>text</strong>.</p>',
};

const siteInfo = {
  site: { title: 'Demo site', url: 'https://example.com', theme: 'default', demo: true },
  collections: {
    posts: {
      path: 'content/posts', label: 'Blog',
      fields: [{ name: 'title', type: 'text' }, { name: 'date', type: 'date' }, { name: 'tags', type: 'list' }, { name: 'draft', type: 'boolean' }],
    },
  },
  navigation: [{ label: 'Home', url: '/' }],
};

globalThis.fetch = async (url) => (String(url).endsWith('/api/posts/index.json')
  ? { ok: true, json: async () => ({ items: [ITEM] }) }
  : { ok: false, json: async () => ({}) });

const { demo, request } = await import(pathToFileURL(path.join(tmp, 'js', 'demo.js')).href);
const decode = (base64) => Buffer.from(base64, 'base64').toString('utf8');
const contents = (file) => `/repos/demo/your-site/contents/${file}`;

test.after(() => fs.rmSync(tmp, { recursive: true, force: true }));

test('entering the demo rebuilds each item as the Markdown the editor would write', async () => {
  await demo.enter(siteInfo);
  assert.equal(demo.active, true);

  const file = await request(contents('content/posts/hello-world.md?ref=main'));
  const text = decode(file.content);
  const { data, body } = parseFrontmatter(text, ITEM.file);

  assert.deepEqual(data, { title: 'Hello, world', date: '2026-07-01', tags: ['launch'], draft: false, example: true });
  assert.equal(body.trim(), ITEM.body.trim());
  // Derived and plugin-added values belong to the build, never to the file.
  for (const key of ['url', 'slug', 'content', 'dateFormatted', 'readingTime', 'collection', 'file']) {
    assert.ok(!(key in data), `"${key}" leaked into the frontmatter`);
  }
});

test('the site config and menu come from the published api/site.json', async () => {
  const config = JSON.parse(decode((await request(contents('site.config.json?ref=main'))).content));
  assert.equal(config.site.title, 'Demo site');
  assert.deepEqual(Object.keys(config.collections), ['posts']);
  const nav = JSON.parse(decode((await request(contents('data/navigation.json?ref=main'))).content));
  assert.deepEqual(nav, [{ label: 'Home', url: '/' }]);
});

test('a folder lists its files, and anything absent 404s like GitHub', async () => {
  const entries = await request(contents('content/posts?ref=main'));
  assert.deepEqual(entries.map((e) => e.name), ['hello-world.md']);
  await assert.rejects(() => request(contents('content/posts/nope.md?ref=main')), (error) => error.status === 404);
});

test('media referenced by the content is listed, so the library has something to show', async () => {
  const { tree } = await request('/repos/demo/your-site/git/trees/main?recursive=1');
  assert.ok(tree.some((entry) => entry.path === 'media/2026/07/lake.jpg'));
});

test('saving writes the file, makes a commit, and the commit shows up in History', async () => {
  const before = await request('/repos/demo/your-site/commits?sha=main&per_page=30');
  const result = await request(contents('content/posts/hello-world.md'), {
    method: 'PUT',
    body: { message: 'post: edit "Hello, world"', content: Buffer.from('---\ntitle: Edited\n---\n\nNew body.\n').toString('base64') },
  });
  assert.ok(result.commit.sha);

  const text = decode((await request(contents('content/posts/hello-world.md?ref=main'))).content);
  assert.match(text, /title: Edited/);

  const after = await request(`/repos/demo/your-site/commits?sha=main&path=content/posts/hello-world.md&per_page=30`);
  assert.equal(after.length, before.length + 1);
  assert.equal(after[0].sha, result.commit.sha);
  assert.equal(after[0].commit.message, 'post: edit "Hello, world"');

  // The version behind that commit is still readable — this is what Restore uses.
  const old = decode((await request(contents(`content/posts/hello-world.md?ref=${before[0].sha}`))).content);
  assert.match(old, /title: Hello, world/);
});

test('the publish pill sees a build that is running, then done', async () => {
  const fresh = await request(contents('content/pages/new.md'), { method: 'PUT', body: { message: 'page: publish "New"', content: Buffer.from('---\ntitle: New\n---\n').toString('base64') } });
  const running = await request(`/repos/demo/your-site/actions/workflows/build-deploy.yml/runs?head_sha=${fresh.commit.sha}&per_page=1`);
  assert.equal(running.workflow_runs[0].status, 'in_progress');

  const seeded = (await request('/repos/demo/your-site/commits?sha=main&per_page=30')).at(-1); // dated in the past
  const done = await request(`/repos/demo/your-site/actions/workflows/build-deploy.yml/runs?head_sha=${seeded.sha}&per_page=1`);
  assert.equal(done.workflow_runs[0].status, 'completed');
  assert.equal(done.workflow_runs[0].conclusion, 'success');
});

test('deleting removes the file', async () => {
  await request(contents('content/pages/new.md'), { method: 'DELETE', body: { message: 'page: delete "New"' } });
  await assert.rejects(() => request(contents('content/pages/new.md?ref=main')), (error) => error.status === 404);
});

test('start over throws the edits away; leaving the demo clears the flag', async () => {
  await demo.reset(siteInfo);
  const text = decode((await request(contents('content/posts/hello-world.md?ref=main'))).content);
  assert.match(text, /title: Hello, world/);
  demo.exit();
  assert.equal(demo.active, false);
});
