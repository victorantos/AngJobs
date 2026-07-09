---
title: Latency charts now show p50 / p95 / p99 per region
date: 2026-05-06
version: v2.2.0
tag: Improved
description: Averages hide the pain. Latency charts now plot percentiles per region, and alert rules can target p95 instead of the mean.
example: true
---

Latency charts plotted the mean, and the mean is a liar: a check can
average 180ms while every twentieth user waits two seconds.

Charts now plot p50, p95, and p99 per region, and alert rules accept
percentile targets — `p95 > 800ms for 5 minutes` is now a first-class
condition. Historical data was backfilled for thirteen months, so the new
charts are immediately useful for arguing with your CDN vendor, which we
understand is their primary use.
