---
title: "Boring technology is a feature you ship"
date: 2026-02-10
description: "A short opinion: every exciting dependency is a pager duty you assigned to your future self."
tags:
  - opinions
example: true
---

Copperline runs on Postgres, one VM, and a queue made of `SKIP LOCKED`. People
occasionally tell me this is not a real architecture. It has had four minutes
of unplanned downtime in two years, so I've stopped arguing.

Here's the position, stated plainly: **for a small team, the reliability of a
system is inversely proportional to how interesting its components are to talk
about.** Interesting components are interesting because their failure modes
aren't fully mapped yet. You don't want unmapped failure modes; you want
boredom. Boredom is what a mapped failure mode feels like.

The counterargument is always leverage — the new thing is faster, or scales
further, or deletes a whole class of code. Sometimes true! But the bill isn't
the learning curve, it's the operating curve: you will be debugging this thing
at 2am in year two, with its worst documentation and your worst judgment. Pick
components whose 2am story you already know.

The test I actually use: *would I be comfortable debugging this with no
internet connection?* Postgres, yes. Nginx, yes. The distributed cache with
the great conference talk, no — so it doesn't ship until the answer changes.

Spend your innovation budget where you're differentiated. Nobody chose
Copperline for its queue. They chose it because it's up.
