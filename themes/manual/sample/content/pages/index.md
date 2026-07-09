---
title: mkweb
description: A single-binary command-line tool that turns a folder of Markdown into a fast, boring, reliable website.
example: true
---

**mkweb** turns a folder of Markdown files into a website. One binary, no runtime, no plugins to babysit. You write files; it writes HTML.

```sh
mkweb new my-site && cd my-site
mkweb dev        # live preview at http://localhost:8080
mkweb build      # static output in ./public
```

Three reasons people keep it around:

- **Nothing to install but itself.** A single static binary for every major platform.
- **Nothing to configure to start.** Sensible defaults; one small `mkweb.json` when you outgrow them.
- **Nothing surprising in the output.** Plain HTML and CSS you can read, host anywhere, and diff.

## Read the manual

The documentation is short by design and ordered like a checklist — start at the top and you'll have a site before you finish your coffee.

1. [Getting started](/docs/getting-started/) — what mkweb is and a five-minute first build
2. [Installation](/docs/installation/) — every platform, plus verifying the binary
3. [Configuration](/docs/configuration/) — the complete `mkweb.json` reference
4. [Commands](/docs/commands/) — every command and flag
5. [Troubleshooting](/docs/troubleshooting/) — the errors you'll actually see, decoded

Looking for something specific? [Search the manual](/search/).
