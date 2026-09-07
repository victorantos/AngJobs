// Golden-file test: build the fixture site and compare every output file,
// byte for byte, against tests/fixtures/expected/.
//
// To regenerate the goldens after an intentional output change:
//   node tests/update-goldens.js
// then review the diff before committing.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../build.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtureRoot = path.join(here, 'fixtures', 'site');
const expectedDir = path.join(here, 'fixtures', 'expected');
const outDir = path.join(here, '.tmp-dist');

function walk(dir, base = dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full, base));
    else files.push(path.relative(base, full));
  }
  return files.sort();
}

test('fixture site builds to exactly the expected files', async () => {
  fs.rmSync(outDir, { recursive: true, force: true });
  const report = await build({ root: fixtureRoot, outDir, quiet: true });

  const expected = walk(expectedDir);
  const actual = walk(outDir);
  assert.deepEqual(actual, expected,
    'built file list differs from tests/fixtures/expected/ — if the change is intentional, run node tests/update-goldens.js and review the diff');

  for (const file of expected) {
    const want = fs.readFileSync(path.join(expectedDir, file), 'utf8');
    const got = fs.readFileSync(path.join(outDir, file), 'utf8');
    assert.equal(got, want, `dist/${file} differs from the golden copy`);
  }

  assert.equal(report.draftCount, 1, 'the draft post must be skipped');

  // §10.5: customizer tokens from config.theme.tokens are injected after the
  // theme CSS, so theme upgrades never overwrite user tweaks.
  const home = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
  assert.match(home, /<style id="theme-tokens">:root\{--color-accent:#c0ffee;--measure:70ch\}<\/style>/);

  fs.rmSync(outDir, { recursive: true, force: true });
});

test('data-only collections (render: false) are editable + in the API, but emit no pages', async () => {
  const tmp = path.join(here, '.tmp-dataonly');
  fs.rmSync(tmp, { recursive: true, force: true });
  await build({ root: fixtureRoot, outDir: tmp, quiet: true });

  // No standalone item pages and no list page for a page-less collection.
  assert.ok(!fs.existsSync(path.join(tmp, 'features')), 'render: false must not emit /features/ pages');

  // Still exposed through the static JSON API (headless access is a free bonus).
  const api = JSON.parse(fs.readFileSync(path.join(tmp, 'api/features/index.json'), 'utf8'));
  assert.equal(api.items.length, 2, 'both feature items are in the API');
  assert.equal(api.items[0].slug, 'alpha', 'items keep their sortBy: order (asc)');
  assert.equal(api.items[0].url, null, 'page-less items carry a null url');

  // Available to templates as collections.<name> — rendered into the home page.
  const home = fs.readFileSync(path.join(tmp, 'index.html'), 'utf8');
  assert.match(home, /data-slug="alpha"[\s\S]*data-slug="beta"/, 'collections.features renders in order');

  // Not pages: excluded from sitemap, search index, and llms.txt.
  assert.doesNotMatch(fs.readFileSync(path.join(tmp, 'sitemap.xml'), 'utf8'), /features/, 'no sitemap entries');
  assert.doesNotMatch(fs.readFileSync(path.join(tmp, 'search-index.json'), 'utf8'), /Alpha feature/, 'not in search index');
  assert.doesNotMatch(fs.readFileSync(path.join(tmp, 'llms.txt'), 'utf8'), /Alpha feature/, 'not in llms.txt');

  fs.rmSync(tmp, { recursive: true, force: true });
});

test('build fails loudly on schema violations, naming file and field', async () => {
  const brokenRoot = path.join(here, '.tmp-broken');
  fs.rmSync(brokenRoot, { recursive: true, force: true });
  fs.cpSync(fixtureRoot, brokenRoot, { recursive: true });
  fs.writeFileSync(path.join(brokenRoot, 'content/posts/bad.md'), '---\ndate: not-a-date\n---\nBody.\n');

  await assert.rejects(
    build({ root: brokenRoot, outDir: path.join(brokenRoot, 'dist'), quiet: true }),
    (err) => err.message.includes('content/posts/bad.md') && err.message.includes('title'),
  );
  fs.rmSync(brokenRoot, { recursive: true, force: true });
});

test('a collection whose template the theme lacks falls back + warns, not fails (§10.4)', async () => {
  const fbRoot = path.join(here, '.tmp-fallback');
  fs.rmSync(fbRoot, { recursive: true, force: true });
  fs.cpSync(fixtureRoot, fbRoot, { recursive: true });
  const config = JSON.parse(fs.readFileSync(path.join(fbRoot, 'site.config.json'), 'utf8'));
  config.collections.posts.template = 'gone-with-a-theme';   // e.g. left over from another starter
  fs.writeFileSync(path.join(fbRoot, 'site.config.json'), JSON.stringify(config));

  const report = await build({ root: fbRoot, outDir: path.join(fbRoot, 'dist'), quiet: true });
  assert.ok(report.pages > 0, 'still builds instead of throwing');
  assert.ok(report.warnings.some((w) => w.includes('gone-with-a-theme') && w.includes('page')), 'warns and names the fallback');
  fs.rmSync(fbRoot, { recursive: true, force: true });
});

test('a page overrides its collection template with `template:` (unknown name falls back, no throw)', async () => {
  const root = path.join(here, '.tmp-tmpl');
  fs.rmSync(root, { recursive: true, force: true });
  fs.cpSync(fixtureRoot, root, { recursive: true });
  fs.writeFileSync(path.join(root, 'content/pages/lp.md'),
    '---\ntitle: LP\ntemplate: landing\nheroCtaLabel: Buy\nheroCtaUrl: https://x.test/buy\n---\nBody.\n');
  fs.writeFileSync(path.join(root, 'content/pages/oops.md'),
    '---\ntitle: Oops\ntemplate: does-not-exist\n---\nBody.\n');

  const report = await build({ root, outDir: path.join(root, 'dist'), quiet: true });
  assert.ok(report.pages > 0, 'still builds');

  const lp = fs.readFileSync(path.join(root, 'dist/lp/index.html'), 'utf8');
  assert.match(lp, /class="landing"/, 'template: landing renders with the landing template');
  assert.match(lp, /data-cta="hero"/, 'and its CTA carries the tracking hook');

  const oops = fs.readFileSync(path.join(root, 'dist/oops/index.html'), 'utf8');
  assert.doesNotMatch(oops, /class="landing"/, 'an unknown template falls back to the collection default, not a failure');

  const api = JSON.parse(fs.readFileSync(path.join(root, 'dist/api/pages/lp.json'), 'utf8'));
  assert.equal(api.template, 'landing', 'the template override rides into the JSON API');

  fs.rmSync(root, { recursive: true, force: true });
});

test('site.basePath prefixes root-relative href/src (C6: project-subpath hosts)', async () => {
  const baseRoot = path.join(here, '.tmp-base');
  const baseOut = path.join(baseRoot, 'dist');
  fs.rmSync(baseRoot, { recursive: true, force: true });
  fs.cpSync(fixtureRoot, baseRoot, { recursive: true });
  const config = JSON.parse(fs.readFileSync(path.join(baseRoot, 'site.config.json'), 'utf8'));
  config.site.basePath = '/sub';
  fs.writeFileSync(path.join(baseRoot, 'site.config.json'), JSON.stringify(config));

  await build({ root: baseRoot, outDir: baseOut, quiet: true });
  const home = fs.readFileSync(path.join(baseOut, 'index.html'), 'utf8');
  assert.match(home, /href="\/sub\/blog\/rss\.xml"/, 'root-relative asset links prefixed');
  assert.match(home, /href="\/sub\/blog\/"/, 'internal nav prefixed');
  assert.doesNotMatch(home, /href="\/sub\/sub\//, 'not double-prefixed');
  assert.doesNotMatch(home, /(href|src)="\/sub\/\//, 'protocol-relative URLs untouched');
  // Redirect fallback targets are prefixed too.
  assert.match(fs.readFileSync(path.join(baseOut, 'old/index.html'), 'utf8'), /url=\/sub\/about\//);
  fs.rmSync(baseRoot, { recursive: true, force: true });
});
