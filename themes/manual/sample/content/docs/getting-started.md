---
title: Getting started
order: "01"
description: What mkweb is, how it thinks about your files, and a five-minute first build.
next: /docs/installation/
nextTitle: Installation
example: true
---

mkweb is a command-line tool that turns a folder of Markdown files into a static website. There is no server, no database, and no plugin ecosystem to maintain — the entire mental model fits in one sentence: **every file in `pages/` becomes a page at the matching URL.**

## The five-minute version

Assuming mkweb is [installed](/docs/installation/):

```sh
mkweb new my-site
cd my-site
mkweb dev
```

Open `http://localhost:8080`. You are looking at `pages/index.md`, rendered live. Edit the file, save, and the browser reloads. When you're happy:

```sh
mkweb build
```

Everything under `public/` is your site — plain HTML and CSS you can host anywhere that serves files.

## How mkweb thinks

A new project is four things:

```
my-site/
├── mkweb.json      # configuration (optional to start)
├── pages/          # Markdown in, HTML out
├── static/         # copied to the output as-is
└── public/         # the build output (never edit by hand)
```

The rules are deliberately dull:

- `pages/index.md` becomes `/`, `pages/pricing.md` becomes `/pricing/`, and `pages/help/faq.md` becomes `/help/faq/`.
- Files in `static/` — images, fonts, a favicon — are copied through untouched.
- `public/` is disposable. Delete it any time; `mkweb build` recreates it byte-for-byte.

> **Tip** — Keep `public/` out of version control. The source of truth is your Markdown; the output is a build artifact.

## Where to next

Work through the manual in order — it's numbered like a checklist. The next section covers [installing mkweb](/docs/installation/) on every platform; after that, [configuration](/docs/configuration/) and the full [command reference](/docs/commands/).
