#!/usr/bin/env node
// tools/engine-manifest.js — generate engine.json (cms-spec.md §14.2).
//
// Lists every engine-owned file with its sha256. Because engine files are
// never hand-edited, the updater compares these hashes to decide which files
// it may replace wholesale and which the user has modified (and must leave).
//
// Run this at release time:  node tools/engine-manifest.js
// It writes engine.json at the repo root. No dependencies.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// The ownership contract (§14.1). Everything here is upstream-owned; the user
// must never hand-edit these paths. Content, data, media, site.config.json,
// and custom themes/plugins are user-owned and never appear in the manifest.
export const ENGINE_FILES = ['build.js', 'config.defaults.json', 'package.json',
  '.github/workflows/build-deploy.yml', '.github/workflows/update.yml'];
export const ENGINE_DIRS = ['lib', 'admin', 'tools', 'migrations',
  'themes/default', 'plugins/search', 'plugins/contact-form', 'plugins/reading-time',
  'plugins/api-form', 'plugins/goatcounter'];

/** Every engine-owned file path (repo-relative, POSIX separators), sorted. */
export function engineFiles(base = root) {
  const files = [];
  const walk = (rel) => {
    const abs = path.join(base, rel);
    if (!fs.existsSync(abs)) return;
    if (fs.statSync(abs).isDirectory()) {
      for (const entry of fs.readdirSync(abs).sort()) walk(path.posix.join(rel, entry));
    } else {
      files.push(rel);
    }
  };
  ENGINE_FILES.forEach(walk);
  ENGINE_DIRS.forEach(walk);
  return files.sort();
}

export const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

/** The highest migration number present in migrations/ (0 if none). §14.4 */
export function migrationLevel(base = root) {
  const dir = path.join(base, 'migrations');
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).reduce((max, f) => {
    const n = f.match(/^(\d+)-.*\.js$/);
    return n ? Math.max(max, Number(n[1])) : max;
  }, 0);
}

export function buildManifest(base = root) {
  const version = JSON.parse(fs.readFileSync(path.join(base, 'package.json'), 'utf8')).version;
  const files = {};
  for (const rel of engineFiles(base)) files[rel] = sha256(fs.readFileSync(path.join(base, rel)));
  return { version, migration: migrationLevel(base), files };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const manifest = buildManifest();
  fs.writeFileSync(path.join(root, 'engine.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`engine.json written: v${manifest.version}, ${Object.keys(manifest.files).length} files`);
}
