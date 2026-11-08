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

test('no honeypot unless asked — existing forms render byte-for-byte as before', () => {
  const html = apiForm.renderPage(page, '[[form:signup]]', site, options);
  assert.doesNotMatch(html, /api-form-trap/);
});

test('honeypot: a hidden, unfocusable text input placed before the real fields', () => {
  const trapped = { forms: { apply: { path: '/apply', honeypot: 'website', fields: [{ name: 'email', type: 'email' }] } } };
  const html = apiForm.renderPage(page, '[[form:apply]]', site, trapped);
  assert.match(html, /<div class="api-form-trap" aria-hidden="true"><label>Leave this field empty <input type="text" name="website" tabindex="-1" autocomplete="off"><\/label><\/div>/);
  assert.ok(html.indexOf('api-form-trap') < html.indexOf('name="email"'), 'the trap comes first — bots fill top to bottom');
  assert.doesNotMatch(html, /type="hidden" name="website"/, 'never type="hidden": bots skip those');
});

test('honeypot: the plugin-level option applies to every form, a form can opt out', () => {
  const opts = { honeypot: 'url', forms: { a: { path: '/a' }, b: { path: '/b', honeypot: false } } };
  assert.match(apiForm.renderPage(page, '[[form:a]]', site, opts), /name="url" tabindex="-1"/);
  assert.doesNotMatch(apiForm.renderPage(page, '[[form:b]]', site, opts), /api-form-trap/);
});

test('honeypot: a bad name or one a real field already uses fails the build with a teaching error', () => {
  const bad = { forms: { f: { path: '/f', honeypot: 'Web Site' } } };
  assert.throws(() => apiForm.renderPage(page, '[[form:f]]', site, bad), /use a field name like "website"/);
  const clash = { forms: { f: { path: '/f', honeypot: 'email', fields: [{ name: 'email', type: 'email' }] } } };
  assert.throws(() => apiForm.renderPage(page, '[[form:f]]', site, clash), /both as a real field and as the honeypot/);
  const hiddenClash = { forms: { f: { path: '/f', honeypot: 'source', hidden: { source: 'x' } } } };
  assert.throws(() => apiForm.renderPage(page, '[[form:f]]', site, hiddenClash), /both as a real field and as the honeypot/);
});

test('proof: the form names the field client.js adds; nothing is emitted for no-JS visitors to trip on', () => {
  const opts = { forms: { apply: { path: '/apply', proof: 'elapsed', honeypot: 'website' } } };
  const html = apiForm.renderPage(page, '[[form:apply]]', site, opts);
  assert.match(html, /<form class="api-form"[^>]* data-proof="elapsed">/);
  assert.doesNotMatch(html, /name="elapsed"/, 'the field itself is added by the script — a scraped form never has it');
  assert.doesNotMatch(apiForm.renderPage(page, '[[form:signup]]', site, options), /data-proof/);
  const same = { forms: { f: { path: '/f', proof: 'website', honeypot: 'website' } } };
  assert.throws(() => apiForm.renderPage(page, '[[form:f]]', site, same), /both honeypot and proof/);
  const clash = { forms: { f: { path: '/f', proof: 'email', fields: [{ name: 'email', type: 'email' }] } } };
  assert.throws(() => apiForm.renderPage(page, '[[form:f]]', site, clash), /both as a real field and as the proof/);
});
