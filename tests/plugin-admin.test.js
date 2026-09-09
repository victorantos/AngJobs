import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { adminScreens, clientAssets } from '../lib/plugins.js';

// A plugin folder on disk, since clientAssets checks that declared files exist.
function pluginDir(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plain-admin-'));
  for (const [name, body] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), body);
  return dir;
}

const withAdmin = (dir) => ({
  name: 'ops', dir, options: {},
  manifest: { admin: { js: 'admin.js', screens: [{ id: 'ops', label: 'Operations' }] } },
});


/** Load backend-data.js with just enough browser to import cleanly. */
async function loadBackendData(store) {
  globalThis.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };
  globalThis.document = { createElement: () => ({ setAttribute() {}, append() {}, addEventListener() {} }) };
  return import(`../admin/js/backend-data.js?t=${Math.random()}`);
}

test('a plugin can declare an admin screen', () => {
  const screens = adminScreens([withAdmin('/nowhere')]);
  assert.deepEqual(screens, [
    { plugin: 'ops', module: '/plugins/ops/admin.js', id: 'ops', label: 'Operations' },
  ]);
});

test('plugins without an admin block contribute nothing', () => {
  assert.deepEqual(adminScreens([{ name: 'search', dir: '/nowhere', manifest: {}, options: {} }]), []);
  assert.deepEqual(adminScreens([{ name: 'x', dir: '/nowhere', manifest: { admin: { js: 'admin.js' } }, options: {} }]), []);
});

test('a screen missing id or label fails the build, naming the plugin', () => {
  const bad = { name: 'ops', dir: '/nowhere', options: {},
    manifest: { admin: { js: 'admin.js', screens: [{ label: 'No id' }] } } };
  assert.throws(() => adminScreens([bad]), /plugins\/ops\/plugin\.json/);
});

test('the admin module is published but never injected into the site', () => {
  const dir = pluginDir({ 'admin.js': 'export default {}', 'client.js': '// site' });
  const plugin = { name: 'ops', dir, options: {},
    manifest: { admin: { js: 'admin.js' }, client: { js: 'client.js' } } };

  const { copies, head, body } = clientAssets([plugin]);
  assert.ok(copies.some((c) => c.to === 'plugins/ops/admin.js'), 'admin.js is copied to dist');
  // The admin imports it on demand; a visitor to the published site must not.
  assert.doesNotMatch(body, /admin\.js/);
  assert.doesNotMatch(head, /admin\.js/);
  assert.match(body, /plugins\/ops\/client\.js/);
});

test('a declared admin file that does not exist fails the build', () => {
  const dir = pluginDir({});
  const plugin = { name: 'ops', dir, options: {}, manifest: { admin: { js: 'admin.js' } } };
  assert.throws(() => clientAssets([plugin]), /declares admin js "admin\.js" but the file doesn't exist/);
});

test('the shipped feedback and sales-analytics plugins declare their screens', () => {
  const read = (n) => JSON.parse(fs.readFileSync(new URL(`../plugins/${n}/plugin.json`, import.meta.url), 'utf8'));
  assert.deepEqual(read('feedback').admin.screens, [{ id: 'feedback', label: 'Feedback' }]);
  assert.deepEqual(read('sales-analytics').admin.screens, [{ id: 'insights', label: 'Insights' }]);
});

// --- apiFetch: the write half of the plugin API ---------------------------
// It is deliberately not a screen factory: a plugin gets a function that
// attaches the operator's credential, never the credential itself.

test('apiFetch resolves the named service and attaches the credential', async () => {
  const { apiFetch } = await loadBackendData({ 'plain.token': 'gho_abc' });
  const calls = [];
  globalThis.fetch = async (url, init) => { calls.push({ url, init }); return new Response('{}', { status: 200 }); };

  await apiFetch({ services: { ops: 'https://ops.test' } }, '/applications', { service: 'ops' });
  assert.equal(calls[0].url, 'https://ops.test/applications');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer gho_abc');
});

test('apiFetch leaves Content-Type alone so FormData keeps its boundary', async () => {
  const { apiFetch } = await loadBackendData({ 'plain.token': 't' });
  let seen;
  globalThis.fetch = async (_url, init) => { seen = init; return new Response('{}', { status: 200 }); };

  await apiFetch({ services: { backend: 'https://b.test' } }, '/cv/', { method: 'POST', body: 'x' });
  assert.equal(seen.headers['Content-Type'], undefined);
  assert.equal(seen.method, 'POST');
});

test('apiFetch names an unset service instead of fetching undefined', async () => {
  const { apiFetch } = await loadBackendData({});
  await assert.rejects(() => apiFetch({ services: {} }, '/x', { service: 'ops' }), /No "ops" service is set/);
});

test('apiFetch turns a refused request into a readable error', async () => {
  const { apiFetch } = await loadBackendData({ 'plain.token': 't' });
  globalThis.fetch = async () => new Response('', { status: 403 });
  await assert.rejects(() => apiFetch({ services: { backend: 'https://b.test' } }, '/x'), /refused that request/);
});
