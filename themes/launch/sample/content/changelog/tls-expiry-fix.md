---
title: TLS expiry warnings no longer double-fire on wildcard certs
date: 2026-06-03
version: v2.3.1
tag: Fixed
description: Monitors sharing a wildcard certificate produced one warning per monitor instead of one per cert. Deduplicated, with apologies to the team that got 40.
example: true
---

If ten monitors shared `*.example.com`, the fourteen-day expiry warning
fired ten times. One team with a large fleet got forty identical warnings
in one morning, which is the opposite of an alerting product's job.

Expiry warnings now deduplicate by certificate fingerprint across your
whole account: one warning, listing every monitor it covers, re-sent at
fourteen days, seven, and one. The fix shipped within 48 hours of the
report because embarrassment is a fine prioritization signal.
