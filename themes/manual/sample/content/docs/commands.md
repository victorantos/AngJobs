---
title: Commands
order: "04"
description: Every mkweb command and flag — new, dev, build, check, upgrade, and version.
prev: /docs/configuration/
prevTitle: Configuration
next: /docs/troubleshooting/
nextTitle: Troubleshooting
example: true
---

mkweb has six commands. Run any of them with `--help` for a summary, or `mkweb --help` for the full list.

| Command         | What it does                                        |
| --------------- | --------------------------------------------------- |
| `mkweb new`     | Scaffold a new project in a fresh directory.        |
| `mkweb dev`     | Serve the site locally and rebuild on every save.   |
| `mkweb build`   | Write the production site to the output folder.     |
| `mkweb check`   | Validate config, frontmatter, and internal links.   |
| `mkweb upgrade` | Replace the mkweb binary with the latest release.   |
| `mkweb version` | Print the version and platform, then exit.          |

## mkweb new

```sh
mkweb new <name> [--bare]
```

Creates `<name>/` with a starter page, a `static/` folder, and a commented `mkweb.json`. With `--bare` you get only the folder structure — no sample content.

## mkweb dev

```sh
mkweb dev [--port <n>] [--open]
```

Builds the site into memory, serves it, and rebuilds whenever a file changes. Nothing is written to disk. `--port` overrides the config; `--open` launches your browser at the local address.

Drafts are included and badged, so you can review unpublished pages in place.

## mkweb build

```sh
mkweb build [--drafts] [--no-minify]
```

Writes the production site to the output folder (default `public/`). The build is deterministic: the same input files produce byte-identical output, which makes deploys trivially cacheable.

- `--drafts` includes pages marked `draft: true` — useful for staging.
- `--no-minify` keeps the HTML readable for debugging.

Exit code is `0` on success and `1` on any error, so it slots straight into CI:

```sh
mkweb check && mkweb build
```

## mkweb check

```sh
mkweb check [--links]
```

Validates `mkweb.json` and every page's frontmatter without building. With `--links` it also resolves every internal link and reports the source line of any that point nowhere.

> **Tip** — Run `mkweb check --links` in CI before `mkweb build`. Broken links are caught in review instead of production.
