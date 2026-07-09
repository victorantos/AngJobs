import test from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../lib/template.js';

test('{{ expr }} escapes, {{{ expr }}} does not', () => {
  const context = { html: '<b>&"bold"</b>' };
  assert.equal(render('{{ html }}', context), '&lt;b&gt;&amp;&quot;bold&quot;&lt;/b&gt;');
  assert.equal(render('{{{ html }}}', context), '<b>&"bold"</b>');
});

test('dot-paths resolve; missing paths render as empty string', () => {
  assert.equal(render('{{ a.b.c }}', { a: { b: { c: 'deep' } } }), 'deep');
  assert.equal(render('[{{ missing.path }}]', {}), '[]');
});

test('{{#if}} / {{else}} follow template truthiness (empty list is false)', () => {
  const t = '{{#if v}}yes{{else}}no{{/if}}';
  assert.equal(render(t, { v: true }), 'yes');
  assert.equal(render(t, { v: 0 }), 'no');
  assert.equal(render(t, { v: [] }), 'no');
  assert.equal(render(t, { v: ['x'] }), 'yes');
  assert.equal(render(t, {}), 'no');
});

test('{{#each list as item}} iterates with a scoped alias', () => {
  const t = '{{#each posts as post}}<{{ post.title }}|{{ outer }}>{{/each}}';
  const out = render(t, { posts: [{ title: 'A' }, { title: 'B' }], outer: 'o' });
  assert.equal(out, '<A|o><B|o>');
});

test('each over a non-list renders nothing', () => {
  assert.equal(render('{{#each nope as x}}!{{/each}}', {}), '');
});

test('nested blocks and nested each aliases', () => {
  const t = '{{#each rows as row}}{{#each row.cells as cell}}{{ cell }},{{/each}};{{/each}}';
  assert.equal(render(t, { rows: [{ cells: [1, 2] }, { cells: [3] }] }), '1,2,;3,;');
});

test('partials render with the current scope', () => {
  const out = render('{{#each items as item}}{{> card}}{{/each}}',
    { items: [{ name: 'x' }] },
    { card: '[{{ item.name }}]' });
  assert.equal(out, '[x]');
});

test('unknown partial throws a helpful error', () => {
  assert.throws(() => render('{{> nope}}', {}), /unknown partial "\{\{> nope\}\}"/);
});

test('unbalanced blocks throw', () => {
  assert.throws(() => render('{{#if x}}oops', {}), /unclosed \{\{#if\}\}/);
  assert.throws(() => render('{{/if}}', {}), /without a matching/);
});
