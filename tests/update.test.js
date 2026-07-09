// Tests for the engine updater (cms-spec.md §14.2–14.4): file-replacement
// policy, user-modification flagging, and migration running.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cmpVersion, applyUpdate } from '../tools/update.js';
import { buildManifest } from '../tools/engine-manifest.js';

const tmp = path.join(path.dirname(fileURLToPath(import.meta.url)), '.tmp-update');

test('cmpVersion orders dotted semver', () => {
  assert.equal(cmpVersion('1.0.0', '1.0.0'), 0);
  assert.equal(cmpVersion('1.0.0', '1.1.0'), -1);
  assert.equal(cmpVersion('1.2.0', '1.1.9'), 1);
  assert.equal(cmpVersion('2.0.0', '1.9.9'), 1);
});

function scaffold(kind) {
  const root = path.join(tmp, kind);
  fs.rmSync(root, { recursive: true, force: true });
  fs.mkdirSync(path.join(root, 'lib'), { recursive: true });
  fs.writeFileSync(path.join(root, 'lib', 'a.js'), 'export const a = 1;\n');
  fs.writeFileSync(path.join(root, 'lib', 'b.js'), 'export const b = 1;\n');
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ version: '1.0.0', type: 'module' }));
  return root;
}

function manifest(root, version, migration = 0) {
  // A minimal manifest over lib/*.js + package.json (engineFiles walks real dirs).
  const m = buildManifest(root);
  m.version = version;
  m.migration = migration;
  fs.writeFileSync(path.join(root, 'engine.json'), JSON.stringify(m, null, 2));
  return m;
}

test('replaces unmodified engine files, flags user-modified ones, runs migrations', async () => {
  const local = scaffold('local');
  manifest(local, '1.0.0');

  const upstream = scaffold('upstream');
  fs.writeFileSync(path.join(upstream, 'lib', 'a.js'), 'export const a = 2; // upstream change\n');
  fs.writeFileSync(path.join(upstream, 'lib', 'b.js'), 'export const b = 2; // upstream change\n');
  fs.writeFileSync(path.join(upstream, 'package.json'), JSON.stringify({ version: '1.1.0', type: 'module' }));
  fs.mkdirSync(path.join(upstream, 'migrations'), { recursive: true });
  fs.writeFileSync(path.join(upstream, 'migrations', '001-marker.js'),
    'import fs from "node:fs";import path from "node:path";export default (root)=>fs.writeFileSync(path.join(root,"MIGRATED"),"ok");\n');
  manifest(upstream, '1.1.0', 1);

  // The user edited lib/b.js locally since install — it must be preserved.
  fs.writeFileSync(path.join(local, 'lib', 'b.js'), 'export const b = 1; // MY LOCAL EDIT\n');

  const report = await applyUpdate(local, upstream);

  assert.equal(report.from, '1.0.0');
  assert.equal(report.to, '1.1.0');
  assert.ok(report.updated.includes('lib/a.js'), 'unmodified file replaced');
  assert.ok(report.flagged.includes('lib/b.js'), 'user-modified file flagged');
  assert.match(fs.readFileSync(path.join(local, 'lib', 'a.js'), 'utf8'), /upstream change/);
  assert.match(fs.readFileSync(path.join(local, 'lib', 'b.js'), 'utf8'), /MY LOCAL EDIT/, 'local edit preserved');
  assert.deepEqual(report.migrations, ['001-marker.js']);
  assert.ok(fs.existsSync(path.join(local, 'MIGRATED')), 'migration ran');
  assert.equal(JSON.parse(fs.readFileSync(path.join(local, 'engine.json'), 'utf8')).version, '1.1.0', 'engine.json advanced');

  fs.rmSync(tmp, { recursive: true, force: true });
});

test('does nothing when already up to date', async () => {
  const local = scaffold('local2');
  manifest(local, '1.2.0');
  const upstream = scaffold('upstream2');
  manifest(upstream, '1.1.0');
  const report = await applyUpdate(local, upstream);
  assert.equal(report.upToDate, true);
  fs.rmSync(tmp, { recursive: true, force: true });
});
