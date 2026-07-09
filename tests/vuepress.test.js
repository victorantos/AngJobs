// Tests for the VuePress importer (tools/migrate/vuepress.js) — cms-spec.md
// §15. The importer is a CLI, so we run it as a child process and inspect its
// output tree, the same harness as tests/jekyll.test.js.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const importer = path.join(root, 'tools', 'migrate', 'vuepress.js');
const tmp = path.join(root, 'tests', '.tmp-vuepress');

function run(fixture, args = [], key = fixture) {
  const out = path.join(tmp, key);
  fs.rmSync(out, { recursive: true, force: true });
  execFileSync('node', [importer, path.join(root, 'tools', 'migrate', 'fixtures', fixture), out, ...args], { stdio: 'pipe' });
  const read = (rel) => fs.readFileSync(path.join(out, rel), 'utf8');
  return {
    out,
    read,
    redirects: JSON.parse(read('data/redirects.json')),
    item: (coll, slug) => read(`content/${coll}/${slug}.md`),
    page: (slug) => read(`content/pages/${slug}.md`),
    has: (rel) => fs.existsSync(path.join(out, rel)),
  };
}

test('subfolders flatten into prefixed slugs with a section field and tag', () => {
  const r = run('vuepress');
  assert.ok(r.has('content/jobs/may-2026-acme-corp-newyork-ny-full-time.md'), 'May item flattened');
  assert.ok(r.has('content/jobs/april-2026-acme-corp-newyork-ny-full-time.md'), 'April twin disambiguated by its folder prefix');
  const may = r.item('jobs', 'may-2026-acme-corp-newyork-ny-full-time');
  assert.match(may, /^section: may-2026$/m, 'section field records the source folder');
  assert.match(may, /tags:\n {2}- may-2026/, 'section is appended to tags');
  assert.ok(r.has('content/pages/index.md'), 'root README became the home page');
  assert.ok(r.has('content/pages/about.md'), 'root-level page imported');
  assert.ok(r.has('content/pages/jobs-index.md'), 'collection-root README moved aside for the list page');
});

test('nested frontmatter flattens to flat keys; VuePress chrome is gone', () => {
  const r = run('vuepress');
  const may = r.item('jobs', 'may-2026-acme-corp-newyork-ny-full-time');
  assert.match(may, /^author: acme$/m, 'author.name claims the bare parent key');
  assert.match(may, /^authorUrl: https:\/\/news\.ycombinator\.com\/item\?id=1$/m, 'author.url becomes authorUrl');
  assert.doesNotMatch(may, /^\s+name:/m, 'no indented nested keys survive');
  for (const slug of ['index', 'about']) {
    assert.doesNotMatch(r.page(slug), /^(icon|home|heroText):/m, 'chrome keys stripped');
  }
});

test('redirects map old VuePress URLs (original case) to new plain URLs', () => {
  const r = run('vuepress');
  assert.equal(r.redirects['/jobs/May-2026/Acme-Corp-NewYork-NY-Full-Time.html'], '/jobs/may-2026-acme-corp-newyork-ny-full-time/');
  assert.equal(r.redirects['/about-us.html'], '/about/', 'the frontmatter permalink wins');
  assert.equal(r.redirects['/jobs/May-2026/'], '/jobs/tag/may-2026/', 'section folder redirects to its tag page');
  assert.equal(r.redirects['/'], undefined, 'the root never redirects');
});

test('components: stripped by default, substituted via --component; code survives', () => {
  const r = run('vuepress');
  const may = r.item('jobs', 'may-2026-acme-corp-newyork-ny-full-time');
  assert.doesNotMatch(may, /<JobApplication/, 'unmapped component stripped');
  assert.match(may, /<FakeComponent \/>/, 'component inside a fenced code block untouched');
  const report = r.read('MIGRATION-REPORT.md');
  assert.match(report, /\| JobApplication \| 2 \|/, 'occurrences counted across files');
  assert.match(report, /Stripped Vue components \(review\): JobApplication ×1/, 'review queue names the stripped component with its count');
  const r2 = run('vuepress', ['--component=JobApplication=[[form:apply]]'], 'vuepress-component');
  assert.match(r2.item('jobs', 'may-2026-acme-corp-newyork-ny-full-time'), /\[\[form:apply\]\]/, 'replacement text substituted');
});

test('public/ assets copy to media/public/ and only real files are rewritten', () => {
  const r = run('vuepress');
  assert.ok(r.has('media/public/logo.svg'), 'public tree copied');
  assert.ok(r.has('media/public/assets/og-image.png'), 'nested public files copied');
  const index = r.page('index');
  assert.match(index, /\]\(\/media\/public\/logo\.svg\)/, 'root-absolute ref to a real public file rewritten');
  assert.match(index, /https:\/\/cdn\.example\.com\/logo\.svg/, 'external URL untouched');
});

test('::: containers become blockquote callouts', () => {
  const r = run('vuepress');
  const about = r.page('about');
  assert.match(about, /> \*\*Tip: Pro move\*\*/, 'kind + title lead the blockquote');
  assert.doesNotMatch(about, /:::/, 'no container fences remain');
});

test('navigation is read from navbar.ts and translated through the URL map', () => {
  const r = run('vuepress');
  const nav = JSON.parse(r.read('data/navigation.json'));
  assert.ok(nav.some((e) => e.label === 'About' && e.url === '/about/'), 'About resolves via the file-path alias');
  assert.ok(nav.some((e) => e.label === 'May 2026' && e.url === '/jobs/tag/may-2026/'), 'object dropdown child ({text, link}) resolves against prefix');
  assert.ok(nav.some((e) => /April/i.test(e.label) && e.url === '/jobs/tag/april-2026/'), 'string dropdown child resolves against prefix');
  const report = r.read('MIGRATION-REPORT.md');
  assert.match(report, /\| Component \| Occurrences \| Action \|/, 'components table present');
});

test('index.md is a folder index, and --base prefixes every old URL', () => {
  const r = run('vuepress', ['--base=/docs/'], 'vuepress-base');
  assert.ok(r.has('content/pages/guide.md'), 'guide/index.md becomes the guide page');
  assert.equal(r.redirects['/docs/guide/'], '/guide/', 'index.md folder URL redirects under the base');
  assert.equal(r.redirects['/docs/jobs/May-2026/Acme-Corp-NewYork-NY-Full-Time.html'],
    '/jobs/may-2026-acme-corp-newyork-ny-full-time/', 'item old URLs carry the base');
  assert.equal(r.redirects['/docs/about-us.html'], '/about/', 'permalinks live under the base too');
  assert.equal(r.redirects['/docs/jobs/'], '/jobs/', 'collection-root README base URL points at the live list');
  const nav = JSON.parse(r.read('data/navigation.json'));
  assert.ok(nav.some((e) => e.label === 'About' && e.url === '/about/'), 'base-relative navbar links still resolve');
  fs.rmSync(tmp, { recursive: true, force: true });
});
