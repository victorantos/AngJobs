import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter, serializeFrontmatter, ContentError } from '../lib/content.js';

test('parses scalars: strings, booleans, numbers, quoted strings, dates', () => {
  const { data, body } = parseFrontmatter(`---
title: Hello world
draft: false
count: 42
quoted: "true"
date: 2026-07-05
---

Body text.`);
  assert.deepEqual(data, {
    title: 'Hello world',
    draft: false,
    count: 42,
    quoted: 'true', // quoting keeps it a string
    date: '2026-07-05',
  });
  assert.equal(body, '\nBody text.');
});

test('parses lists as "key:" followed by "- item" lines', () => {
  const { data } = parseFrontmatter(`---
tags:
  - launch
  - hello world
empty:
---
`);
  assert.deepEqual(data.tags, ['launch', 'hello world']);
  assert.deepEqual(data.empty, []);
});

test('a blank line ends a list', () => {
  const { data } = parseFrontmatter(`---
tags:
  - one

title: After blank
---
`);
  assert.deepEqual(data.tags, ['one']);
  assert.equal(data.title, 'After blank');
});

test('body is preserved exactly, including --- inside it', () => {
  const { body } = parseFrontmatter(`---
title: X
---
Line one.

---

Line two.`);
  assert.equal(body, 'Line one.\n\n---\n\nLine two.');
});

test('missing opening --- is an error naming line 1', () => {
  assert.throws(() => parseFrontmatter('title: No fence\n', 'content/pages/bad.md'),
    (err) => err instanceof ContentError && err.message.includes('content/pages/bad.md:1'));
});

test('unclosed frontmatter is an error', () => {
  assert.throws(() => parseFrontmatter('---\ntitle: X\n', 'a.md'),
    /frontmatter never ends/);
});

test('unparseable lines are errors with the line number', () => {
  assert.throws(() => parseFrontmatter('---\ntitle: ok\n???\n---\n', 'a.md'),
    (err) => err.message.includes('a.md:3'));
});

test('serialize → parse round-trips data and body (the admin save path)', () => {
  const data = {
    title: 'Hello: a title',
    date: '2026-07-05',
    draft: false,
    count: 3,
    tricky: 'false',        // string that looks like a boolean → gets quoted
    empty: '',
    tags: ['a', 'b c'],
    example: true,
  };
  const body = '\nBody **text**.\n';
  const text = serializeFrontmatter(data, body, ['title', 'date', 'draft']);
  const parsed = parseFrontmatter(text, 'roundtrip.md');
  assert.deepEqual(parsed.data, data);
  assert.equal(parsed.body.trim(), 'Body **text**.');
  // schema fields come first, in schema order
  assert.match(text, /^---\ntitle: Hello: a title\ndate: 2026-07-05\ndraft: false\n/);
});

test('serializer refuses multi-line values with a clear message', () => {
  assert.throws(() => serializeFrontmatter({ title: 'a\nb' }, ''), /line break/);
});
