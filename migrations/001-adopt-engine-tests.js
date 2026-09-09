// 001 — tests/ became engine-owned in 1.20.1.
//
// Sites installed before then carry their own copy of tests/, and their
// engine.json lists none of it. The updater therefore has no installed hash to
// compare against, reads every differing file as "the user edited this", and
// leaves the whole tree behind — including goldens that no longer match the
// build.js the same upgrade just installed. The site's next deploy fails on its
// own stale fixtures, and because engine.json has meanwhile advanced, the drift
// is permanent: every later upgrade flags the same files again.
//
// tools/update.js learned to handle this case (see `claimed`), but the updater
// that runs an upgrade is the *installed* one, so that fix cannot apply to the
// release carrying it. A migration can: it ships with upstream and runs there.
// It receives only the local root, so it locates upstream through its own path.
//
// Idempotent: copying an identical tree twice changes nothing.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export default (root) => {
  const upstream = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const from = path.join(upstream, 'tests');
  const to = path.join(root, 'tests');

  // Running inside the engine's own repo: nothing to adopt.
  if (path.resolve(root) === upstream || !fs.existsSync(from)) return;

  // Only the paths upstream actually owns are replaced. A test the site wrote
  // itself sits at a path upstream doesn't ship, so it is left alone.
  let copied = 0;
  const walk = (rel) => {
    for (const entry of fs.readdirSync(path.join(from, rel), { withFileTypes: true })) {
      const next = path.join(rel, entry.name);
      if (entry.isDirectory()) { walk(next); continue; }
      const src = path.join(from, next);
      const dest = path.join(to, next);
      if (fs.existsSync(dest) && fs.readFileSync(dest).equals(fs.readFileSync(src))) continue;
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
      copied += 1;
    }
  };
  walk('');

  if (copied) console.log(`  001: adopted ${copied} engine-owned file(s) under tests/ — review the diff`);
};
