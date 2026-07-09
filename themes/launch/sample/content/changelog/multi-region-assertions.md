---
title: Assertions now run in every region
date: 2026-06-26
version: v2.4.0
tag: New
description: Response assertions — status, headers, body contains — now evaluate per region, so a CDN serving stale content in one geography finally pages you.
example: true
---

Assertions used to run only from your primary region. Now every check in
every region evaluates the full assertion set, and the alert names the
regions that failed.

Why it matters: the classic silent failure is a CDN node serving stale or
partial content in one geography while the origin looks perfect. That
failure mode is now a page, not a support ticket from an annoyed customer
in Sydney.

Existing checks got per-region assertions automatically, using your
current rules. Nothing to configure unless you want per-region overrides —
which are new too, under **Check → Regions → Advanced**.
