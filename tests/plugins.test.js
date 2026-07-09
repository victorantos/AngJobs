import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPlugins, runHook, runRenderHook, clientAssets } from '../lib/plugins.js';

const fixtureRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'site');

test('loadPlugins reads manifests and merges pluginOptions over defaults', async () => {
  const config = { plugins: ['stamp'], pluginOptions: { stamp: { note: 'override' } } };
  const [stamp] = await loadPlugins(fixtureRoot, config);
  assert.equal(stamp.name, 'stamp');
  assert.equal(stamp.options.note, 'override');       // config wins
  assert.equal(stamp.options.unchanged, 'keep');      // manifest default survives
  assert.equal(typeof stamp.hooks.transformContent, 'function');
});

test('an enabled but missing plugin is a clear error', async () => {
  await assert.rejects(loadPlugins(fixtureRoot, { plugins: ['nope'] }),
    /plugins\/nope.*copy the plugin folder in, or remove/s);
});

test('a throwing plugin fails the build with its name in the error', async () => {
  const plugins = [{ name: 'angry', hooks: { init() { throw new Error('boom'); } }, options: {} }];
  await assert.rejects(runHook(plugins, 'init', {}), /plugins\/angry.*"angry" plugin failed in init\(\): boom/s);
});

test('renderPage hooks chain, each receiving the previous HTML', async () => {
  const plugins = [
    { name: 'a', hooks: { renderPage: (page, html) => html + 'A' }, options: {} },
    { name: 'skip', hooks: {}, options: {} },
    { name: 'b', hooks: { renderPage: (page, html) => html + 'B' }, options: {} },
  ];
  assert.equal(await runRenderHook(plugins, {}, 'X', {}), 'XAB');
});

test('clientAssets builds injection HTML in config order and exposes options', async () => {
  const plugins = await loadPlugins(fixtureRoot, { plugins: ['stamp'] });
  const { copies, head, body } = clientAssets(plugins);
  assert.deepEqual(copies.map((c) => c.to), ['plugins/stamp/client.js', 'plugins/stamp/client.css']);
  assert.match(head, /<link rel="stylesheet" href="\/plugins\/stamp\/client.css">/);
  assert.match(head, /"note":"default-note"/); // options JSON for client code
  assert.match(body, /<script type="module" src="\/plugins\/stamp\/client.js"><\/script>/);
});

test('clientAssets exposes named services under the reserved $services key', async () => {
  const plugins = await loadPlugins(fixtureRoot, { plugins: ['stamp'] });
  const { head } = clientAssets(plugins, { backend: 'https://api.x.test' });
  assert.match(head, /"\$services":\{"backend":"https:\/\/api\.x\.test"\}/);
  assert.doesNotMatch(clientAssets(plugins).head, /\$services/);     // no services → no key
  assert.doesNotMatch(clientAssets(plugins, {}).head, /\$services/); // empty map too
});
