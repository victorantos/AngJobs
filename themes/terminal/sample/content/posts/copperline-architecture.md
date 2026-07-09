---
title: "Copperline's architecture, top to bottom"
date: 2026-04-08
description: "Every component of a profitable one-person SaaS, as a list you can read in two minutes. Fewer parts than you think."
tags:
  - architecture
  - saas
example: true
---

People assume a paid monitoring service has an exciting architecture. It has a deliberately boring one, sized so that a single person can hold all of it in their head *while also doing support, billing, and marketing*. Here is every component, top to bottom.

## The whole system

- **Edge** — one load balancer from the VM provider, TLS termination included. No CDN; the app is fast and the assets are tiny.
- **App** — a single Node process per VM, two VMs. Server-rendered HTML, a sprinkle of vanilla JS. No SPA, no build pipeline beyond `esbuild` for the sprinkle.
- **Probes** — three small Go binaries in three regions. They do one thing: run checks, POST results home. They hold no state and can die freely.
- **Database** — one Postgres instance, one read replica for failover, not for reads. Everything is in it: accounts, checks, results, [the job queue](/blog/a-postgres-queue-two-years-in/), sessions.
- **Queue** — a table in that Postgres. Covered at length elsewhere; short version: `SKIP LOCKED` and a worker loop.
- **Status pages** — static HTML regenerated on change and served from object storage. A customer's status page must not depend on my app being up; that's the one place I spend redundancy.
- **Email** — a transactional provider behind a queue job. The only external service on the critical path of an alert.
- **Backups** — nightly `pg_dump` to object storage in a second provider, restore-tested monthly by a script that actually loads it into a scratch VM.

## What's deliberately missing

- **No Kubernetes** — two VMs and systemd. Deploys are `rsync` + restart, thirty seconds, done from a Makefile.
- **No microservices** — the probes are the only separate deployable, and only because they must live in other regions.
- **No cache tier** — Postgres with sane indexes serves every page under 50 ms. A cache is a second database that lies.

## The test

Every part earns its place by passing one question: *if this breaks at 3 a.m., can half-asleep me fix it?* Each pays rent, or it gets deleted. That question has vetoed more architecture than any budget ever did.
