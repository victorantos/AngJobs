// tests/i18n.test.js — multilingual support (cms-spec.md §5.4): suffix parsing,
// strings merging, per-language collection views, config validation, and full
// builds of the fixture site with languages configured.
//
// Backward compatibility is proven by the golden test in build.test.js: the
// fixture site has no site.languages, and its goldens are byte-identical to
// the pre-i18n output except for the "languages": [] field in api/site.json.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../build.js';
import { validateConfig } from '../lib/content.js';
import { DEFAULT_STRINGS, activeLanguages, splitLangSuffix, stringsFor, localizedCollections, localizedNav } from '../lib/i18n.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtureRoot = path.join(here, 'fixtures', 'site');

/** Copy the fixture site into tests/.tmp-<name> with languages ["en", "fr"]. */
function i18nFixture(name) {
  const root = path.join(here, `.tmp-${name}`);
  fs.rmSync(root, { recursive: true, force: true });
  fs.cpSync(fixtureRoot, root, { recursive: true });
  const configPath = path.join(root, 'site.config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  config.site.languages = ['en', 'fr'];
  fs.writeFileSync(configPath, JSON.stringify(config));
  return root;
}

test('splitLangSuffix: recognizes only configured language suffixes', () => {
  const languages = ['en', 'fr'];
  assert.deepEqual(splitLangSuffix('about.fr', languages), { base: 'about', lang: 'fr' });
  assert.deepEqual(splitLangSuffix('about', languages), { base: 'about', lang: null });
  assert.deepEqual(splitLangSuffix('about.de', languages), { base: 'about.de', lang: null });
  assert.deepEqual(splitLangSuffix('index.fr', languages), { base: 'index', lang: 'fr' });
  assert.deepEqual(splitLangSuffix('about.fr', []), { base: 'about.fr', lang: null });
});

test('activeLanguages: on only with 2+ codes including the default', () => {
  assert.deepEqual(activeLanguages({ language: 'en', languages: ['en', 'fr'] }), ['en', 'fr']);
  assert.deepEqual(activeLanguages({ language: 'en', languages: [] }), []);
  assert.deepEqual(activeLanguages({ language: 'en', languages: ['en'] }), []);
  assert.deepEqual(activeLanguages({ language: 'en', languages: ['fr', 'ro'] }), []);
  assert.deepEqual(activeLanguages({ language: 'en' }), []);
});

test('stringsFor: engine defaults ← theme ← default-language file ← language file, per key', () => {
  const data = { 'strings.en': { newer: 'Fresher' }, 'strings.fr': { older: 'Plus ancien' } };
  const theme = { older: 'Theme older', page: 'P' };
  const fr = stringsFor('fr', 'en', theme, data);
  assert.equal(fr.older, 'Plus ancien');                         // the language file wins
  assert.equal(fr.newer, 'Fresher');                             // missing key → default-language file
  assert.equal(fr.page, 'P');                                    // → theme strings.json
  assert.equal(fr.notFoundTitle, DEFAULT_STRINGS.notFoundTitle); // → engine defaults
  const en = stringsFor('en', 'en', theme, data);
  assert.equal(en.newer, 'Fresher');
  assert.equal(en.older, 'Theme older');
});

test('localizedCollections: per-slug substitution, default order, fallback to default', () => {
  const collections = { posts: [{ slug: 'a', title: 'A' }, { slug: 'b', title: 'B' }] };
  const translations = { posts: [{ slug: 'b', title: 'B-fr', language: 'fr' }, { slug: 'a', title: 'A-ro', language: 'ro' }] };
  assert.deepEqual(localizedCollections(collections, translations, 'fr').posts.map((i) => i.title), ['A', 'B-fr']);
  assert.deepEqual(localizedCollections(collections, translations, 'ro').posts.map((i) => i.title), ['A-ro', 'B']);
});

test('localizedNav: labels from the language file, urls localized where translated, per-entry fallback', () => {
  const nav = [{ label: 'Home', url: '/' }, { label: 'About', url: '/about/' }, { label: 'Blog', url: '/blog/' }];
  const deNav = [{ label: 'Startseite', url: '/' }, { label: 'Über', url: '/about/' }];
  const translated = new Set(['/de/', '/de/about/']); // '/' and '/about/' have German versions; '/blog/' does not
  assert.deepEqual(localizedNav(nav, deNav, 'de', translated), [
    { label: 'Startseite', url: '/de/' },
    { label: 'Über', url: '/de/about/' },
    { label: 'Blog', url: '/blog/' }, // no language entry → default label; no translation → default url
  ]);
  // no language file → labels unchanged, urls still localized
  assert.deepEqual(localizedNav(nav, undefined, 'de', translated).map((e) => e.label), ['Home', 'About', 'Blog']);
});

test('config: site.languages defaults to [] and is validated', () => {
  const config = () => ({ site: { title: 'T', url: 'https://t.test' } });
  assert.deepEqual(validateConfig(config()).site.languages, []);

  const badCode = config();
  badCode.site.languages = ['en', 'French'];
  assert.throws(() => validateConfig(badCode), /lowercase language codes/);

  const noDefault = config();
  noDefault.site.languages = ['fr', 'ro'];
  assert.throws(() => validateConfig(noDefault), /must include the default language "en"/);

  const good = config();
  good.site.languages = ['en', 'pt-br'];
  assert.deepEqual(validateConfig(good).site.languages, ['en', 'pt-br']);
});

test('translated pages build to /<lang>/… with merged collections, localized nav and strings', async () => {
  const root = i18nFixture('i18n');
  const out = path.join(root, 'dist');
  fs.writeFileSync(path.join(root, 'content/pages/about.fr.md'), '---\ntitle: À propos\ndescription: La page à propos.\n---\n\nBonjour **monde**.\n');
  fs.writeFileSync(path.join(root, 'content/pages/index.fr.md'), '---\ntitle: Accueil\ndescription: La page d’accueil.\n---\n\nBienvenue.\n');
  fs.writeFileSync(path.join(root, 'content/posts/first-post.fr.md'), '---\ntitle: Premier billet\ndate: 2026-01-01\ndescription: Le premier billet.\n---\n\nCorps.\n');
  fs.writeFileSync(path.join(root, 'content/features/alpha.fr.md'), '---\ntitle: Fonction alpha\norder: 1\n---\nLa première.\n');
  fs.writeFileSync(path.join(root, 'data/strings.en.json'), JSON.stringify({ tagline: 'Hello' }));
  fs.writeFileSync(path.join(root, 'data/strings.fr.json'), JSON.stringify({ tagline: 'Bonjour' }));
  // A visible {{ strings.* }} probe on the page template.
  const pageTpl = path.join(root, 'themes/plain/templates/page.html');
  fs.writeFileSync(pageTpl, fs.readFileSync(pageTpl, 'utf8') + '<p class="tagline">{{ strings.tagline }}</p>\n');

  const report = await build({ root, outDir: out, quiet: true });

  // Translated pages exist at /<lang>/<default-path>/ with the right <html lang>.
  const aboutFr = fs.readFileSync(path.join(out, 'fr/about/index.html'), 'utf8');
  assert.match(aboutFr, /<html lang="fr">/);
  assert.match(aboutFr, /À propos/);
  // …and only where a translation file exists: no ghost pages, no translated lists.
  assert.ok(fs.existsSync(path.join(out, 'fr/blog/first-post/index.html')), 'translated post renders');
  assert.ok(!fs.existsSync(path.join(out, 'fr/blog/index.html')), 'no translated list pages');
  assert.ok(!fs.existsSync(path.join(out, 'fr/blog/second-post')), 'untranslated post has no /fr/ page');

  // hreflang alternates on every language version of a translated page.
  assert.match(aboutFr, /hreflang="en" href="https:\/\/fixture\.test\/about\/"/);
  assert.match(aboutFr, /hreflang="fr" href="https:\/\/fixture\.test\/fr\/about\/"/);
  const aboutEn = fs.readFileSync(path.join(out, 'about/index.html'), 'utf8');
  assert.match(aboutEn, /hreflang="fr" href="https:\/\/fixture\.test\/fr\/about\/"/);

  // Strings resolve per language, falling back per key.
  assert.match(aboutEn, /<p class="tagline">Hello<\/p>/);
  assert.match(aboutFr, /<p class="tagline">Bonjour<\/p>/);

  // Merged view: the fr home lists ALL features — alpha translated, beta fallback.
  const homeFr = fs.readFileSync(path.join(out, 'fr/index.html'), 'utf8');
  assert.match(homeFr, /Fonction alpha/);
  assert.match(homeFr, /Beta feature/);

  // Nav URLs localize per entry only when the target translation exists.
  assert.match(homeFr, /<a href="\/fr\/" aria-current="page">Home<\/a>/);
  assert.match(homeFr, /<a href="\/blog\/">Blog<\/a>/);

  // Outputs: sitemap gains translated URLs; RSS and llms.txt stay default-language.
  assert.match(fs.readFileSync(path.join(out, 'sitemap.xml'), 'utf8'), /fixture\.test\/fr\/about\//);
  assert.doesNotMatch(fs.readFileSync(path.join(out, 'blog/rss.xml'), 'utf8'), /\/fr\//);
  assert.doesNotMatch(fs.readFileSync(path.join(out, 'llms.txt'), 'utf8'), /\/fr\//);

  // API: per-language item files, language fields, translations pointers.
  const aboutFrJson = JSON.parse(fs.readFileSync(path.join(out, 'api/pages/about.fr.json'), 'utf8'));
  assert.equal(aboutFrJson.language, 'fr');
  assert.equal(aboutFrJson.url, '/fr/about/');
  const pagesIndex = JSON.parse(fs.readFileSync(path.join(out, 'api/pages/index.json'), 'utf8'));
  const aboutEntry = pagesIndex.items.find((i) => i.slug === 'about');
  assert.equal(aboutEntry.language, 'en');
  assert.deepEqual(aboutEntry.translations, ['fr']);
  assert.equal(JSON.parse(fs.readFileSync(path.join(out, 'api/features/alpha.fr.json'), 'utf8')).url, null, 'data-only translations stay page-less');

  // Search index entries carry lang; the translated page is findable.
  const searchIdx = JSON.parse(fs.readFileSync(path.join(out, 'search-index.json'), 'utf8'));
  assert.ok(searchIdx.some((e) => e.url === '/fr/about/' && e.lang === 'fr'));
  assert.ok(searchIdx.every((e) => e.lang), 'every entry carries lang when i18n is on');

  assert.equal(report.draftCount, 1, 'draft handling unchanged');
  fs.rmSync(root, { recursive: true, force: true });
});

test('drafts: a draft translation is skipped, and a drafted original drafts its translations', async () => {
  const root = i18nFixture('i18n-drafts');
  fs.writeFileSync(path.join(root, 'content/posts/second-post.fr.md'), '---\ntitle: Deuxième\ndate: 2026-02-02\ndraft: true\n---\nX.\n');
  fs.writeFileSync(path.join(root, 'content/posts/draft-post.fr.md'), '---\ntitle: Brouillon\ndate: 2026-03-03\n---\nX.\n');
  const report = await build({ root, outDir: path.join(root, 'dist'), quiet: true });
  assert.equal(report.draftCount, 3, 'the original draft plus both unpublishable translations');
  assert.ok(!fs.existsSync(path.join(root, 'dist/fr')), 'nothing published under /fr/');
  fs.rmSync(root, { recursive: true, force: true });
});

test('i18n build errors teach: orphans, unknown suffixes, colliding slugs', async () => {
  let root = i18nFixture('i18n-orphan'); // translation without an original
  fs.writeFileSync(path.join(root, 'content/pages/ghost.fr.md'), '---\ntitle: Fantôme\n---\nX.\n');
  await assert.rejects(build({ root, outDir: path.join(root, 'dist'), quiet: true }),
    (err) => err.message.includes('ghost.fr.md') && err.message.includes('ghost.md'));
  fs.rmSync(root, { recursive: true, force: true });

  root = i18nFixture('i18n-suffix'); // suffix that is not a configured language
  fs.writeFileSync(path.join(root, 'content/pages/about.de.md'), '---\ntitle: Über\n---\nX.\n');
  await assert.rejects(build({ root, outDir: path.join(root, 'dist'), quiet: true }), /not one of site\.languages/);
  fs.rmSync(root, { recursive: true, force: true });

  root = i18nFixture('i18n-collide'); // a default-language slug shadowing a language code
  fs.writeFileSync(path.join(root, 'content/pages/fr.md'), '---\ntitle: France\n---\nX.\n');
  await assert.rejects(build({ root, outDir: path.join(root, 'dist'), quiet: true }), /language code "fr"/);
  fs.rmSync(root, { recursive: true, force: true });

  root = i18nFixture('i18n-default-suffix'); // a "translation" into the default language
  fs.writeFileSync(path.join(root, 'content/pages/about.en.md'), '---\ntitle: About again\n---\nX.\n');
  await assert.rejects(build({ root, outDir: path.join(root, 'dist'), quiet: true }), /default language/);
  fs.rmSync(root, { recursive: true, force: true });
});

test('without site.languages nothing changes (see also the golden test)', async () => {
  const root = path.join(here, '.tmp-i18n-off');
  fs.rmSync(root, { recursive: true, force: true });
  fs.cpSync(fixtureRoot, root, { recursive: true });
  const out = path.join(root, 'dist');
  await build({ root, outDir: out, quiet: true });
  assert.ok(!('language' in JSON.parse(fs.readFileSync(path.join(out, 'api/pages/about.json'), 'utf8'))));
  assert.ok(JSON.parse(fs.readFileSync(path.join(out, 'search-index.json'), 'utf8')).every((e) => !('lang' in e)));
  assert.doesNotMatch(fs.readFileSync(path.join(out, 'about/index.html'), 'utf8'), /hreflang/);
  fs.rmSync(root, { recursive: true, force: true });
});
