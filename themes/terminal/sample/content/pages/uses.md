---
title: Uses
description: The hardware, software, and services behind a one-person software company.
lede: Asked often enough that it earned a page.
example: true
---

Everything here is what I actually use daily, not what I'd recommend to sound interesting. The theme is the same as [the architecture](/blog/copperline-architecture/): fewer moving parts, replaceable parts.

## Hardware

- A mid-range laptop, three years old, dock and one large monitor. The constraint is deliberate — if the product feels slow here, it's slow.
- A mechanical keyboard I will not apologize for.

## Development

- Terminal, tmux, and an editor with the LSP turned on. The exact editor changes every couple of years; the muscle memory that matters is the shell's.
- Postgres for everything stateful, including [the job queue](/blog/a-postgres-queue-two-years-in/).
- Node for the product, Go for the probes, `make` for the glue.

## Services

- One cloud VM provider, two regions, plain VMs — no orchestrator.
- Object storage for backups, tested restores monthly (calendar reminder, not good intentions).
- Error tracking and an external status check on the status checker, because someone has to watch the watcher.

## Writing

- Posts are Markdown files in the site repo. Drafts start in [jotfile](/projects/) and graduate when they stop being embarrassing.
