---
title: Configuration
order: "03"
description: The complete mkweb.json reference — every option, its default, and when to change it.
prev: /docs/installation/
prevTitle: Installation
next: /docs/commands/
nextTitle: Commands
example: true
---

Configuration lives in one file, `mkweb.json`, at the root of your project. **Every option has a working default** — a new project builds with no configuration at all. Add keys only when you need them.

## A complete example

```json
{
  "title": "Field Notes",
  "url": "https://fieldnotes.example",
  "language": "en",
  "output": "public",
  "clean_urls": true,
  "minify": true,
  "port": 8080
}
```

## Option reference

| Option       | Type    | Default    | What it does |
| ------------ | ------- | ---------- | ------------ |
| `title`      | string  | `"Site"`   | Used in page titles and the RSS feed. |
| `url`        | string  | `""`       | The production origin; required for correct canonical links and sitemaps. |
| `language`   | string  | `"en"`     | The `lang` attribute on every page. |
| `output`     | string  | `"public"` | Where `mkweb build` writes the site. |
| `clean_urls` | boolean | `true`     | `about.md` → `/about/` instead of `/about.html`. |
| `minify`     | boolean | `true`     | Minifies HTML and CSS in production builds. |
| `port`       | number  | `8080`     | The port `mkweb dev` listens on. |

## Rules worth knowing

- Unknown keys are an error, not a warning. A typo like `"prot": 8080` stops the build with the line number and the nearest valid name.
- Paths are always relative to `mkweb.json`, never to your current directory.
- `mkweb check` validates the file without building — useful in CI.

> **Warning** — `output` is deleted and recreated on every build. Never point it at a folder containing files you want to keep.

## Per-page settings

Anything page-specific — titles, descriptions, draft status — belongs in that page's frontmatter, not in `mkweb.json`:

```markdown
---
title: About
description: Who we are and why the site exists.
draft: false
---
```

A page with `draft: true` is served by `mkweb dev` (with a badge, so you can preview it) but excluded from `mkweb build` entirely.
