import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown } from '../lib/markdown.js';

test('headings get slug ids; duplicates get numeric suffixes', () => {
  const html = renderMarkdown('## Hello World\n\n## Hello World\n');
  assert.match(html, /<h2 id="hello-world">Hello World<\/h2>/);
  assert.match(html, /<h2 id="hello-world-1">Hello World<\/h2>/);
});

test('heading ids reset between documents', () => {
  renderMarkdown('## Same\n');
  const html = renderMarkdown('## Same\n');
  assert.match(html, /id="same"/);
  assert.doesNotMatch(html, /id="same-1"/);
});

test('external links get rel="noopener"; internal links do not', () => {
  const html = renderMarkdown('[out](https://example.org) and [in](/about/)');
  assert.match(html, /<a href="https:\/\/example.org" rel="noopener">out<\/a>/);
  assert.match(html, /<a href="\/about\/">in<\/a>/);
});

test('images are lazy and async with alt text', () => {
  const html = renderMarkdown('![A lake](/media/lake.jpg)');
  assert.match(html, /<img src="\/media\/lake.jpg" alt="A lake" loading="lazy" decoding="async">/);
});

test('GFM tables and fenced code with language classes work', () => {
  const html = renderMarkdown('| a |\n|---|\n| 1 |\n\n```js\nlet x = 1\n```');
  assert.match(html, /<table>/);
  assert.match(html, /<code class="language-js">/);
});
