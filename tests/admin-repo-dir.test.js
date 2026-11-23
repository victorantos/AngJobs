// tests/admin-repo-dir.test.js — a site in a subfolder of its repository
// (site.repoDir) and a renamed publish workflow (site.buildWorkflow).
// The admin passes site-relative paths everywhere; admin/js/github.js alone adds
// the folder on the way to GitHub and strips it on the way back. These tests
// record every URL the helpers request (fetch and localStorage are stubbed —
// no network, no browser) and check both the subfolder and the default layout.

import test from 'node:test';
import assert from 'node:assert/strict';
import { validateConfig } from '../lib/content.js';

const store = new Map([['plain.repo', 'acme/app'], ['plain.token', 't'], ['plain.branch', 'main']]);
const storage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true, writable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: { getItem: () => null }, configurable: true, writable: true });

// The fake GitHub: answers by route, records each call as "METHOD path?query".
const calls = [];
const bodies = [];
const TREE = [
  { path: 'site/media/2026/01/a.jpg', type: 'blob', sha: 'b1' },
  { path: 'site/media/.gitkeep', type: 'blob', sha: 'b2' },
  { path: 'site/content/posts/hello.md', type: 'blob', sha: 'b3' },
  { path: 'site-old/media/x.jpg', type: 'blob', sha: 'b4' },
  { path: 'media/root.jpg', type: 'blob', sha: 'b5' },
  { path: 'src/app.js', type: 'blob', sha: 'b6' },
  { path: 'site/media/2026', type: 'tree', sha: 't1' },
];
globalThis.fetch = async (url, { method = 'GET', body } = {}) => {
  const route = url.replace('https://api.github.com/repos/acme/app/', '');
  calls.push(`${method} ${route}`);
  if (body) bodies.push(JSON.parse(body));
  const reply = (data) => ({ ok: true, status: 200, json: async () => data, blob: async () => data });
  if (route.startsWith('git/trees/main')) return reply({ tree: TREE });
  if (route.startsWith('git/ref/heads/')) return reply({ object: { sha: 'p1' } });
  if (route.startsWith('git/commits/')) return reply({ tree: { sha: 'tr1' } });
  if (route === 'git/blobs') return reply({ sha: 'newblob' });
  if (route === 'git/trees') return reply({ sha: 'tr2' });
  if (route === 'git/commits') return reply({ sha: 'c2' });
  if (route.startsWith('git/refs/heads/')) return reply({});
  if (route.startsWith('commits?')) return reply([{ sha: 'c1', commit: { committer: { date: '2026-01-01' }, message: 'post: publish "Hi"', author: { name: 'V' } } }]);
  if (route.startsWith('actions/')) return reply({ workflow_runs: [{ id: 1 }] });
  if (route.startsWith('contents/')) {
    if (method !== 'GET') return reply({ content: { sha: 's2' }, commit: { sha: 'c3' } });
    const path = route.slice('contents/'.length).split('?')[0];
    if (path.endsWith('posts')) return reply([{ name: 'hello.md', path: `${path}/hello.md`, type: 'file' }]);
    return reply({ content: btoa('hi'), sha: 's1' });
  }
  return { ok: false, status: 404, json: async () => ({ message: 'Not Found' }) };
};
globalThis.URL.createObjectURL = () => 'blob:x';

const gh = await import('../admin/js/github.js');
const last = () => calls.at(-1);

/** Run every helper once and return the calls made. */
async function exercise() {
  calls.length = 0; bodies.length = 0;
  await gh.getFile('site.config.json');
  await gh.getFileAt('content/posts/hello.md', 'abc');
  await gh.putFile('media/2026/01/b.jpg', { base64: 'AA==' }, 'media: add b.jpg');
  await gh.deleteFile('content/posts/old.md', 'post: delete', 's1');
  await gh.listDir('content/posts');
  await gh.fileObjectUrl('media/2026/01/a.jpg');
  await gh.commitsFor('content/posts/hello.md');
  await gh.commitsFor('');
  await gh.runFor('c1');
  return [...calls];
}

test('default layout: every path is exactly what it was before (repo root, build-deploy.yml)', async () => {
  gh.configureSite({});
  assert.equal(gh.siteRepo.dir, '');
  assert.equal(gh.siteRepo.buildWorkflow, 'build-deploy.yml');
  assert.deepEqual(await exercise(), [
    'GET contents/site.config.json?ref=main',
    'GET contents/content/posts/hello.md?ref=abc',
    'PUT contents/media/2026/01/b.jpg',
    'DELETE contents/content/posts/old.md',
    'GET contents/content/posts?ref=main',
    'GET contents/media/2026/01/a.jpg?ref=main',
    'GET commits?sha=main&per_page=30&path=content%2Fposts%2Fhello.md',
    'GET commits?sha=main&per_page=30',
    'GET actions/workflows/build-deploy.yml/runs?head_sha=c1&per_page=1',
  ]);
});

test('repoDir: every read, write, list, history and upload path is prefixed with the folder', async () => {
  gh.configureSite({ repoDir: 'site', buildWorkflow: 'site.yml' });
  assert.deepEqual(await exercise(), [
    'GET contents/site/site.config.json?ref=main',
    'GET contents/site/content/posts/hello.md?ref=abc',
    'PUT contents/site/media/2026/01/b.jpg',          // uploads land in <repoDir>/media/…
    'DELETE contents/site/content/posts/old.md',
    'GET contents/site/content/posts?ref=main',
    'GET contents/site/media/2026/01/a.jpg?ref=main',
    'GET commits?sha=main&per_page=30&path=site%2Fcontent%2Fposts%2Fhello.md',
    'GET commits?sha=main&per_page=30&path=site',   // "the whole site" = its folder, not the app's commits
    'GET actions/workflows/site.yml/runs?head_sha=c1&per_page=1',
  ]);
});

test('repoDir: listDir hands back site-relative paths, so they round-trip into getFile', async () => {
  gh.configureSite({ repoDir: 'site' });
  const [entry] = await gh.listDir('content/posts');
  assert.equal(entry.path, 'content/posts/hello.md');
  await gh.getFile(entry.path);
  assert.equal(last(), 'GET contents/site/content/posts/hello.md?ref=main');
});

test('repoDir: the tree is filtered to the folder and stripped of it (look-alike folders excluded)', async () => {
  gh.configureSite({ repoDir: 'site' });
  const media = await gh.listTree('media/');
  assert.deepEqual(media.map((f) => f.path), ['media/2026/01/a.jpg', 'media/.gitkeep']);
  assert.equal(media[0].sha, 'b1');
  // The site URL a media file is copied as stays /media/… — no folder in it.
  assert.equal(`/${media[0].path}`, '/media/2026/01/a.jpg');
  assert.deepEqual((await gh.listTree('')).map((f) => f.path), ['media/2026/01/a.jpg', 'media/.gitkeep', 'content/posts/hello.md']);
});

test('default layout: listTree is the plain prefix filter it always was', async () => {
  gh.configureSite({});
  assert.deepEqual((await gh.listTree('media/')).map((f) => f.path), ['media/root.jpg']);
});

test('repoDir: an atomic multi-file commit writes every entry inside the folder', async () => {
  gh.configureSite({ repoDir: 'site' });
  bodies.length = 0;
  await gh.commitFiles([
    { path: 'site.config.json', content: '{}\n' },
    { path: 'themes/x/a.css', sha: 'keep' },
    { path: 'plugins/old/index.js', delete: true },
  ], 'settings: apply');
  const tree = bodies.find((b) => b.base_tree).tree;
  assert.deepEqual(tree.map((t) => [t.path, t.sha]), [['site/site.config.json', 'newblob'], ['site/themes/x/a.css', 'keep'], ['site/plugins/old/index.js', null]]);
});

test('updateFile (read-modify-write) uses the prefixed paths through its default io', async () => {
  gh.configureSite({ repoDir: 'apps/web' });
  calls.length = 0;
  await gh.updateFile('data/navigation.json', () => '[]\n', 'navigation: update menu');
  assert.deepEqual(calls, ['GET contents/apps/web/data/navigation.json?ref=main', 'PUT contents/apps/web/data/navigation.json']);
});

test('configureSite normalizes the folder and falls back to the defaults', () => {
  for (const [given, dir] of [['/site/', 'site'], ['./site', 'site'], ['apps/web/', 'apps/web'], ['', ''], [undefined, '']]) {
    gh.configureSite({ repoDir: given });
    assert.equal(gh.siteRepo.dir, dir, String(given));
    assert.equal(gh.siteRepo.buildWorkflow, 'build-deploy.yml');
  }
  gh.configureSite({ repoDir: 'site' });
  assert.equal(gh.toRepo(''), 'site');
  assert.equal(gh.toRepo('media/a.jpg'), 'site/media/a.jpg');
  assert.equal(gh.fromRepo('site/media/a.jpg'), 'media/a.jpg');
  assert.equal(gh.fromRepo('site-old/x'), 'site-old/x');
});

test('demo mode ignores repoDir — its in-tab repository is the site alone', async () => {
  gh.configureSite({ repoDir: 'site', buildWorkflow: 'site.yml' });
  globalThis.sessionStorage = { getItem: (k) => (k === gh.DEMO_FLAG ? '1' : null) };
  try {
    assert.equal(gh.repoDir(), '');
    assert.equal(gh.toRepo('content/a.md'), 'content/a.md');
  } finally { globalThis.sessionStorage = { getItem: () => null }; }
  assert.equal(gh.repoDir(), 'site');
});

test('site.repoDir and site.buildWorkflow are validated and normalized at build time', () => {
  const config = (site) => ({ site: { title: 'T', url: 'https://t.test', ...site } });
  assert.equal(validateConfig(config({ repoDir: '/site/' })).site.repoDir, 'site');
  assert.equal(validateConfig(config({ repoDir: 'apps/web' })).site.repoDir, 'apps/web');
  assert.equal(validateConfig(config({ repoDir: '' })).site.repoDir, '');
  assert.equal(validateConfig(config({})).site.repoDir, undefined);           // absent stays absent: api/site.json unchanged
  assert.equal(validateConfig(config({ buildWorkflow: 'site.yml' })).site.buildWorkflow, 'site.yml');
  assert.throws(() => validateConfig(config({ repoDir: '../elsewhere' })), /site\.repoDir/);
  assert.throws(() => validateConfig(config({ repoDir: 'a//b' })), /site\.repoDir/);
  assert.throws(() => validateConfig(config({ repoDir: 3 })), /site\.repoDir/);
  assert.throws(() => validateConfig(config({ buildWorkflow: '.github/workflows/x.yml' })), /site\.buildWorkflow/);
  assert.throws(() => validateConfig(config({ buildWorkflow: 'deploy' })), /site\.buildWorkflow/);
});
