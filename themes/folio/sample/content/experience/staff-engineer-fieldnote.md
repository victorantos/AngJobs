---
title: Staff product engineer
date: 2023-09-01
organization: Fieldnote
period: 2023 — present
location: Remote (EU)
summary: Own the editor and publishing pipeline of a collaborative research tool used by 40,000 teams.
description: Own the editor and publishing pipeline of a collaborative research tool used by 40,000 teams.
highlights:
  - Led the editor rewrite to CRDT-based sync — conflict reports dropped 94% and offline editing shipped
  - Cut p95 publish latency from 6.1s to 800ms by moving rendering to an incremental pipeline
example: true
---

Fieldnote is a collaborative research notebook. I own the editing and
publishing surface end to end — the part users touch for hours a day.

The work that mattered most: replacing last-write-wins syncing with a CRDT
model (a year of careful migration, zero data loss), and rebuilding the
publish pipeline so a 300-page workspace republishes incrementally instead
of from scratch. Both projects shipped behind flags, rolled out gradually,
and were boring by launch day — which was the point.

I also run the team's writing culture: design docs before code for anything
crossing a service boundary, and a changelog readers actually read.
