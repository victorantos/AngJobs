import test from 'node:test';
import assert from 'node:assert/strict';
import apiForm from '../plugins/api-form/index.js';

const site = { config: { services: { backend: 'https://api.x.test' } } };
const options = {
  forms: {
    signup: {
      path: '/signups',
      encoding: 'json',
      button: 'Sign up',
      fields: [{ name: 'email', type: 'email', label: 'Email', required: true }],
      hidden: { source: 'site "quoted"' },
      success: "You're in!",
      storageKey: 'signedUp',
    },
  },
};
const page = { url: '/join/', title: 'Join' };

test('[[form:name]] becomes a form posting to the named service', () => {
  const html = apiForm.renderPage(page, '<p>[[form:signup]]</p>', site, options);
  assert.match(html, /<form class="api-form" method="POST" action="https:\/\/api\.x\.test\/signups"/);
  assert.match(html, /data-encoding="json"/);
  assert.match(html, /data-storage-key="signedUp"/);
  assert.match(html, /<input type="email" name="email" required>/);
  assert.match(html, /value="site &quot;quoted&quot;"/); // hidden values are escaped
  assert.match(html, /<button type="submit">Sign up<\/button>/);
  // rendering a second page must produce the same result — no regex state leaks
  assert.equal(apiForm.renderPage(page, '<p>[[form:signup]]</p>', site, options), html);
});

test('several markers on one page each become a form', () => {
  const html = apiForm.renderPage(page, '[[form:signup]] then [[form:signup]]', site, options);
  assert.equal(html.match(/<form class="api-form"/g).length, 2);
});

test('a page without markers is returned unchanged', () => {
  assert.equal(apiForm.renderPage(page, '<p>plain</p>', site, options), '<p>plain</p>');
});

test('missing service shows the setup hint instead of a form', () => {
  const html = apiForm.renderPage(page, '[[form:signup]]', { config: {} }, options);
  assert.match(html, /set "services": \{ "backend": "https:\/\/…" \}/);
});

test('an unknown form name is left in place with a console warning', () => {
  const warned = [];
  const original = console.warn;
  console.warn = (message) => warned.push(message);
  try {
    // pages may quote the syntax in code samples — prose must never fail a build
    assert.equal(apiForm.renderPage(page, '<code>[[form:nope]]</code>', site, options), '<code>[[form:nope]]</code>');
  } finally {
    console.warn = original;
  }
  assert.match(warned.join('\n'), /no form "nope" is declared/);
});

test('a declared form with a bad path fails the build with a teaching error', () => {
  const bad = { forms: { oops: { path: 'signups' } } };
  assert.throws(() => apiForm.renderPage(page, '[[form:oops]]', site, bad),
    /"path" starting with "\/"/);
});

test('hidden values resolve {page.field} tokens at build time', () => {
  const tokens = { forms: { t: { path: '/x', hidden: { url: 'https://x.test{page.url}', author: '{page.author}', missing: '{page.nope}' } } } };
  const html = apiForm.renderPage({ url: '/jobs/a/', title: 'A', author: 'acme "quoted"' }, '[[form:t]]', site, tokens);
  assert.match(html, /name="url" value="https:\/\/x\.test\/jobs\/a\/"/);
  assert.match(html, /name="author" value="acme &quot;quoted&quot;"/, 'resolved values are escaped');
  assert.match(html, /name="missing" value=""/, 'unknown fields resolve to empty');
});

test('closes: static deadline line + data attributes for the client gate', () => {
  const closing = { forms: { ends: { path: '/x', closes: '2026-08-01', closedMessage: 'Too late!' } } };
  const html = apiForm.renderPage(page, '[[form:ends]]', site, closing);
  assert.match(html, /data-closes="2026-08-01" data-closed-message="Too late!"/);
  assert.match(html, /<p class="api-form-deadline">Sign-ups close on August 1, 2026\.<\/p>/);

  const bad = { forms: { ends: { path: '/x', closes: 'next month' } } };
  assert.throws(() => apiForm.renderPage(page, '[[form:ends]]', site, bad), /ISO date like "2026-08-01"/);
});
