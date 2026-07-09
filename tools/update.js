#!/usr/bin/env node
// tools/update.js — apply an engine update (cms-spec.md §14.2–14.4).
//
// Upgrades are replacements, not merges. Engine files (listed in engine.json)
// are never hand-edited, so the updater replaces them wholesale — no three-way
// merge, no conflicts. A file whose current hash doesn't match the *installed*
// manifest was modified by the user: the updater leaves it and flags it for a
// manual/AI merge. Config never conflicts (§14.3, handled at build time by the
// config.defaults.json merge). Migrations run between the installed and target
// levels (§14.4).
//
//   node tools/update.js <upstream-root>
//
// <upstream-root> is a checkout or extracted tarball of the new version. The
// update.yml workflow downloads the release there, runs this, then tests +
// builds and opens a PR. No dependencies.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { sha256 } from './engine-manifest.js';

/** Compare dotted semver strings. Returns -1 / 0 / 1. */
export function cmpVersion(a, b) {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) < (pb[i] || 0) ? -1 : 1;
  return 0;
}

/**
 * Apply the upstream engine over the local repo.
 * @returns {{from, to, updated: string[], added: string[], flagged: string[], removed: string[], migrations: string[], upToDate: boolean}}
 */
export async function applyUpdate(localRoot, upstreamRoot, { run = true } = {}) {
  const readJson = (base, file) => JSON.parse(fs.readFileSync(path.join(base, file), 'utf8'));
  const installed = readJson(localRoot, 'engine.json');
  const target = readJson(upstreamRoot, 'engine.json');
  const report = { from: installed.version, to: target.version, updated: [], added: [], flagged: [], removed: [], migrations: [], upToDate: false };

  if (cmpVersion(target.version, installed.version) <= 0) { report.upToDate = true; return report; }

  const write = (rel) => {
    const dest = path.join(localRoot, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(upstreamRoot, rel), dest);
  };

  for (const [rel, targetHash] of Object.entries(target.files)) {
    const localPath = path.join(localRoot, rel);
    if (!fs.existsSync(localPath)) { write(rel); report.added.push(rel); continue; }
    const localHash = sha256(fs.readFileSync(localPath));
    if (localHash === targetHash) continue;                 // already identical
    if (localHash === installed.files[rel]) { write(rel); report.updated.push(rel); } // unmodified since install → safe to replace
    else report.flagged.push(rel);                          // user-modified → leave for manual/AI merge
  }
  // Engine files that upstream dropped, if the user never touched them.
  for (const rel of Object.keys(installed.files)) {
    if (rel in target.files) continue;
    const localPath = path.join(localRoot, rel);
    if (fs.existsSync(localPath) && sha256(fs.readFileSync(localPath)) === installed.files[rel]) { fs.rmSync(localPath); report.removed.push(rel); }
  }

  // Migrations strictly between installed and target levels (§14.4). Idempotent.
  const migDir = path.join(upstreamRoot, 'migrations');
  if (fs.existsSync(migDir)) {
    const pending = fs.readdirSync(migDir).filter((f) => /^\d+-.*\.js$/.test(f))
      .map((f) => ({ n: Number(f.match(/^(\d+)/)[1]), f }))
      .filter((m) => m.n > (installed.migration || 0) && m.n <= (target.migration || 0))
      .sort((a, b) => a.n - b.n);
    for (const { f } of pending) {
      if (run) {
        const mod = await import(pathToFileURL(path.join(migDir, f)).href);
        await mod.default(localRoot);
      }
      report.migrations.push(f);
    }
  }

  fs.copyFileSync(path.join(upstreamRoot, 'engine.json'), path.join(localRoot, 'engine.json'));
  return report;
}

/** A human- and AI-readable PR body from the report. */
export function reportMarkdown(r) {
  const list = (items) => items.length ? items.map((i) => `- \`${i}\``).join('\n') : '_none_';
  return `# Update plain ${r.from} → ${r.to}

Engine files are replaced wholesale (no merge, no conflicts). Merge this PR to upgrade; revert it to roll back.

## Updated (${r.updated.length})
${list(r.updated)}

## Added (${r.added.length})
${list(r.added)}

## Removed (${r.removed.length})
${list(r.removed)}

${r.migrations.length ? `## Migrations run\n${list(r.migrations)}\n` : ''}
## ⚠ Locally modified — needs manual or AI merge (${r.flagged.length})
${list(r.flagged)}
${r.flagged.length ? '\nThese engine files differ from the version you installed, so the updater left them untouched. Re-apply your change on top of the new upstream copy (open each file in the diff), or ask Claude Code to reconcile them.' : ''}`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const upstream = process.argv[2];
  if (!upstream) { console.error('usage: node tools/update.js <upstream-root>'); process.exit(1); }
  const report = await applyUpdate(process.cwd(), path.resolve(upstream));
  if (report.upToDate) { console.log(`Already up to date (v${report.from}).`); process.exit(0); }
  console.log(reportMarkdown(report));
}
