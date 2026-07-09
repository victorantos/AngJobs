# migrations/

> **Moving an existing blog into plain?** You want the importers — see
> [`tools/migrate/README.md`](../tools/migrate/README.md) for the
> step-by-step guide. This folder is different: it holds the engine's own
> upgrade scripts, run automatically by `tools/update.js` when plain itself
> updates. You never run these by hand.

Breaking changes ship as idempotent scripts here (cms-spec.md §14.4). The
updater (`tools/update.js`) runs every migration whose number is greater than
the installed engine's migration level and not greater than the target's.

## Convention

One file per migration, named `NNN-short-description.js`, numbered in order:

```
migrations/
├── 001-rename-cover-to-hero.js
├── 002-move-authors-into-data.js
└── …
```

Each file is plain Node (no dependencies) that default-exports a function
taking the repo root. It must be **idempotent** — safe to run twice:

```js
// migrations/001-rename-cover-to-hero.js
import fs from 'node:fs';
import path from 'node:path';

export default function migrate(root) {
  const config = path.join(root, 'site.config.json');
  const text = fs.readFileSync(config, 'utf8');
  if (!text.includes('"cover"')) return;              // already migrated — no-op
  fs.writeFileSync(config, text.replaceAll('"cover"', '"hero"'));
}
```

The engine's migration level is the highest `NNN` present here, recorded in
`engine.json` by `tools/engine-manifest.js`. A fresh install starts at the
current level (its migrations are considered already applied); migrations run
only when *updating* from an older level.
