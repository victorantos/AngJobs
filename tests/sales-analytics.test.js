import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../build.js';

const here = path.dirname(fileURLToPath(import.meta.url));

// The reports view lives in the admin (Insights tab, GET /reports). The plugin is now
// purely the client-side tracker: it injects a beacon script on every page and exposes
// the resolved backend endpoint under $services — no standalone dashboard page.
test('enabled in a build, it injects its tracking client and exposes $services for the beacon', async () => {
  const root = path.join(here, '.tmp-sa-build');
  fs.rmSync(root, { recursive: true, force: true });
  fs.cpSync(path.join(here, 'fixtures', 'site'), root, { recursive: true });
  fs.cpSync(path.join(here, '..', 'plugins', 'sales-analytics'), path.join(root, 'plugins', 'sales-analytics'), { recursive: true });
  const config = JSON.parse(fs.readFileSync(path.join(root, 'site.config.json'), 'utf8'));
  config.plugins = [...config.plugins, 'sales-analytics']; // fixture already has services.backend
  fs.writeFileSync(path.join(root, 'site.config.json'), JSON.stringify(config));

  const dist = path.join(root, 'dist');
  await build({ root, outDir: dist, quiet: true });

  assert.ok(fs.existsSync(path.join(dist, 'plugins', 'sales-analytics', 'client.js')), 'tracking client copied');
  assert.ok(!fs.existsSync(path.join(dist, 'insights', 'index.html')), 'no standalone dashboard page — reports live in the admin now');
  const home = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  assert.match(home, /src="\/plugins\/sales-analytics\/client\.js/, 'client injected on every page');
  const options = JSON.parse(home.match(/<script id="plugin-options"[^>]*>(.*?)<\/script>/s)[1]);
  assert.equal(options.$services.backend, 'https://backend.fixture.test', '$services rides along so the client resolves the endpoint');
  assert.ok(options['sales-analytics'], 'plugin options are exposed to the client');

  fs.rmSync(root, { recursive: true, force: true });
});
