---
title: Projects
description: What I've shipped — the business, the side projects, and the tools that escaped.
lede: One product pays the bills. The rest keep me honest.
example: true
---

## Copperline

Uptime monitoring and status pages for small teams. Checks from three regions, alerting over email and webhooks, and status pages you can point a CNAME at. Around 400 paying teams; run entirely by me since 2023. The stack is deliberately dull — [I wrote it up in full](/blog/copperline-architecture/).

## jotfile

A command-line notebook: `jot "thought"` appends to a dated Markdown file, `jot -s query` searches everything you've ever jotted. Built in a weekend, which turned into [an essay about scope](/blog/shipping-jotfile/). Single binary, no daemon, your notes are just files.

## pgq-worker

The job-queue worker extracted from Copperline: Postgres, `SKIP LOCKED`, exponential backoff, ~500 lines, no opinions about your framework. Two years of production behind it — [the numbers are here](/blog/a-postgres-queue-two-years-in/).

## This site

Markdown in Git, built with plain, deployed from a push. The [migration from Jekyll](/blog/migrating-from-jekyll/) took an afternoon, most of which was redirects. The theme you're looking at is the part I fuss over.
