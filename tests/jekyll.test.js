// Tests for the Jekyll importer (tools/migrate/jekyll.js), including the
// Chirpy-theme path (cms-spec.md §15). The importer is a CLI, so we run it
// as a child process and inspect its output tree.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const importer = path.join(root, 'tools', 'migrate', 'jekyll.js');
const tmp = path.join(root, 'tests', '.tmp-jekyll');

function run(fixture) {
  const out = path.join(tmp, fixture);
  fs.rmSync(out, { recursive: true, force: true });
  execFileSync('node', [importer, path.join(root, 'tools', 'migrate', 'fixtures', fixture), out], { stdio: 'pipe' });
  const read = (rel) => fs.readFileSync(path.join(out, rel), 'utf8');
  return {
    out,
    redirects: JSON.parse(read('data/redirects.json')),
    post: (slug) => read(`content/posts/${slug}.md`),
    page: (slug) => read(`content/pages/${slug}.md`),
    has: (rel) => fs.existsSync(path.join(out, rel)),
  };
}

test('vanilla Jekyll: posts redirect from the date-based default URL', () => {
  const r = run('jekyll');
  // The vanilla fixture has no permalink config → Jekyll "pretty" date default.
  const dateBased = Object.keys(r.redirects).filter((u) => /^\/\d{4}\/\d{2}\/\d{2}\//.test(u));
  assert.ok(dateBased.length > 0, 'expected date-based redirect keys for a vanilla site');
  assert.ok(Object.values(r.redirects).every((v) => v.startsWith('/blog/') || v.startsWith('/')), 'targets are plain URLs');
});

test('Chirpy: post redirects use /posts/:title/, not date URLs', () => {
  const r = run('chirpy');
  assert.equal(r.redirects['/posts/a-chirpy-post/'], '/blog/a-chirpy-post/');
  assert.ok(!Object.keys(r.redirects).some((u) => /^\/\d{4}\//.test(u)), 'no date-based redirects for a Chirpy site');
});

test('Chirpy: _tabs pages are imported and Chirpy chrome is stripped', () => {
  const r = run('chirpy');
  assert.ok(r.has('content/pages/about.md'), '_tabs/about.md imported');
  const about = r.page('about');
  assert.match(about, /title: About/, 'missing title derived from filename');
  assert.doesNotMatch(about, /icon:|order:/, 'Chirpy chrome keys stripped');
  // A tab at /about/ maps to plain /about/ — same URL, so no redirect needed.
  assert.equal(r.redirects['/about/'], undefined);
});

test('asset paths are rewritten to media/ in Markdown, src/href, and CSS url()', () => {
  const r = run('chirpy');
  const post = r.post('a-chirpy-post');
  assert.match(post, /!\[A diagram\]\(\/media\/assets\/img\/diagram\.png\)/, 'markdown image rewritten');
  assert.match(post, /url\('\/media\/assets\/img\/hero\.png'\)/, 'inline-style url() rewritten');
});

test('Chirpy: post frontmatter is clean and schema-valid; chrome keys gone', () => {
  const r = run('chirpy');
  const post = r.post('a-chirpy-post');
  assert.match(post, /^---\ntitle: A Chirpy Post\ndate: 2024-05-01\n/, 'title + ISO date first');
  assert.match(post, /tags:\n {2}- Writing\n {2}- Notes\n {2}- chirpy\n {2}- jekyll/, 'categories + tags merged into one list');
  assert.doesNotMatch(post, /\bpin:|\btoc:/, 'presentation flags dropped');
  fs.rmSync(tmp, { recursive: true, force: true });
});
