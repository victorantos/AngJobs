import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { adminScreens } from '../lib/plugins.js';
import applications, { findEmails } from '../plugins/job-applications/admin.js';

const manifest = JSON.parse(fs.readFileSync(new URL('../plugins/job-applications/plugin.json', import.meta.url), 'utf8'));

test('the plugin contributes an Applications admin screen its module exports', () => {
  assert.deepEqual(adminScreens([{ name: 'job-applications', dir: 'plugins/job-applications', manifest, options: {} }]), [
    { plugin: 'job-applications', module: '/plugins/job-applications/admin.js', id: 'applications', label: 'Applications' },
  ]);
  assert.equal(typeof applications.screens.applications, 'function');
});

test('findEmails reads plain, mailto and obfuscated addresses from an HN body', () => {
  assert.deepEqual(findEmails('Apply: <a href="mailto:hiring@foo.io">us</a> or jobs [at] acme [dot] com'), ['hiring@foo.io', 'jobs@acme.com']);
  assert.deepEqual(findEmails('reach alice at bar dot co dot uk. Senior Engineer at Stripe.'), ['alice@bar.co.uk']);
  assert.deepEqual(findEmails('bob(at)baz.dev &#x2F; dan&#x40;qux.ai.'), ['bob@baz.dev', 'dan@qux.ai']);
});

test('findEmails skips placeholders and the site itself, and finds nothing in prose', () => {
  assert.deepEqual(findEmails('you@example.com or hello@angjobs.com'), []);
  assert.deepEqual(findEmails('Berlin at our office, onsite'), []);
  assert.deepEqual(findEmails('Same: A@B.io, a@b.io'), ['a@b.io']);
});
