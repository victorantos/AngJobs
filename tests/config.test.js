import test from 'node:test';
import assert from 'node:assert/strict';
import { validateConfig, validateFields, urlFor, ContentError } from '../lib/content.js';
import { slugify } from '../lib/util.js';

const goodConfig = () => ({
  site: { title: 'T', url: 'https://t.test' },
  collections: {
    posts: {
      path: 'content/posts',
      urlPattern: '/blog/:slug/',
      template: 'post',
      fields: [{ name: 'title', type: 'text', required: true }],
    },
  },
});

test('a valid config passes and gets defaults filled in', () => {
  const config = validateConfig(goodConfig());
  assert.equal(config.site.language, 'en');
  assert.equal(config.site.theme, 'default');
  assert.equal(config.collections.posts.sortOrder, 'desc');
  assert.equal(config.collections.posts.pageSize, 10);
  assert.equal(config.collections.posts.label, 'Posts');
  assert.deepEqual(config.plugins, []);
});

test('trailing slash on site.url is normalized away', () => {
  const config = goodConfig();
  config.site.url = 'https://t.test/';
  assert.equal(validateConfig(config).site.url, 'https://t.test');
});

test('config errors name the problem and the fix', () => {
  assert.throws(() => validateConfig({}), /missing "site" section/);
  assert.throws(() => validateConfig({ site: { url: 'https://x.test' } }), /site\.title/);
  assert.throws(() => validateConfig({ site: { title: 'T', url: 'not-a-url' } }), /site\.url/);

  const noSlug = goodConfig();
  noSlug.collections.posts.urlPattern = '/blog/';
  assert.throws(() => validateConfig(noSlug), /:slug/);

  const badType = goodConfig();
  badType.collections.posts.fields.push({ name: 'x', type: 'wysiwyg' });
  assert.throws(() => validateConfig(badType), /unknown type "wysiwyg"/);

  const listNoTemplate = goodConfig();
  listNoTemplate.collections.posts.listUrl = '/blog/';
  assert.throws(() => validateConfig(listNoTemplate), /listTemplate/);
});

test('field validation: required, types, defaults, select options', () => {
  const fields = [
    { name: 'title', type: 'text', required: true },
    { name: 'date', type: 'date' },
    { name: 'tags', type: 'list' },
    { name: 'draft', type: 'boolean', default: false },
    { name: 'kind', type: 'select', options: ['a', 'b'] },
  ];
  const data = { title: 'ok', date: '2026-07-05', tags: ['x'], kind: 'a' };
  validateFields(data, fields, 'f.md');
  assert.equal(data.draft, false); // default applied

  assert.throws(() => validateFields({}, fields, 'f.md'), (err) =>
    err instanceof ContentError && err.message.includes('missing required field "title"'));
  assert.throws(() => validateFields({ title: 'x', date: 'July 5' }, fields, 'f.md'), /ISO date/);
  assert.throws(() => validateFields({ title: 'x', tags: 'launch' }, fields, 'f.md'), /must be a list/);
  assert.throws(() => validateFields({ title: 'x', draft: 'yes' }, fields, 'f.md'), /true or false/);
  assert.throws(() => validateFields({ title: 'x', kind: 'c' }, fields, 'f.md'), /one of: a, b/);
});

test('services: https URLs only, trailing slash normalized, defaults to {}', () => {
  const withServices = goodConfig();
  withServices.services = { backend: 'https://api.t.test/' };
  assert.equal(validateConfig(withServices).services.backend, 'https://api.t.test');
  assert.deepEqual(validateConfig(goodConfig()).services, {});

  const insecure = goodConfig();
  insecure.services = { backend: 'http://api.t.test' };
  assert.throws(() => validateConfig(insecure), /"services\.backend" must be an https:\/\/ URL/);

  const notAString = goodConfig();
  notAString.services = { backend: { url: 'https://api.t.test', key: 'oops' } };
  assert.throws(() => validateConfig(notAString), /never put keys or secrets/);
});

test('urlFor: pattern substitution, index collapse, trailing slash', () => {
  assert.equal(urlFor('/blog/:slug/', 'hello'), '/blog/hello/');
  assert.equal(urlFor('/:slug/', 'about'), '/about/');
  assert.equal(urlFor('/:slug/', 'index'), '/');
  assert.equal(urlFor('/docs/:slug', 'guide'), '/docs/guide/');
});

test('slugify: lowercase, accents stripped, safe characters only', () => {
  assert.equal(slugify('Héllo, Wörld!'), 'hello-world');
  assert.equal(slugify('  Spaces   & symbols?! '), 'spaces-symbols');
  assert.equal(slugify('already-a-slug'), 'already-a-slug');
});
