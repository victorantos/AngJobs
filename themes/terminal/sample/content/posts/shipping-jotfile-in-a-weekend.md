---
title: "Shipping jotfile in a weekend (and maintaining it for three years)"
date: 2026-03-02
description: "The weekend was the easy part. What a tiny side project actually costs after the launch tweet, and why I'd still do it again."
tags:
  - side-projects
  - essays
example: true
---

jotfile is a 400-line CLI that turns a folder of text files into a searchable
notebook. I built it in a weekend, tweeted it, got forty stars, and went back
to work. That was three years ago. It's still running on four of my machines
and, judging by the issues, a few hundred other people's.

Here is the honest ledger.

## What the weekend bought

The weekend bought a tool that solved my problem. That's all a launch is: the
moment the thing works for its first user, who is you. Scope was the whole
trick — no config file, no plugins, no sync. Text in a folder, search on top.
Every feature I refused on Saturday is a feature I didn't maintain for three
years.

## What the three years cost

About one evening a quarter. A dependency update, a PR to review, one genuinely
gnarly Unicode bug that took a whole Sunday. Call it twelve evenings total —
less time than I've spent on hobbies I have nothing to show for.

The costs that actually hurt weren't time:

- **The guilt backlog.** Seventeen open issues I'll never fix feel heavier than
  they are. I eventually wrote a `MAINTENANCE.md` saying exactly what the
  project will and won't do, and closed twelve of them against it. Nobody was
  angry. Relief is a feature you can ship.
- **The pull toward product.** Every few months someone asks for a hosted
  version. The flattering read is "business opportunity." The accurate read is
  "different project, ten times the surface area." Copperline exists because I
  eventually said yes to that pull — once, deliberately, for the right idea.

## The actual return

jotfile never made a dollar and was never supposed to. What it paid out
instead: it's the code sample I've linked in every contract negotiation since,
it taught me the release mechanics I later used for real, and twice a year a
stranger emails to say they use it daily. That email is worth more than the
stars.

Ship the small thing. Say what it won't do, in writing, on day one. The
weekend is cheap; the boundary is what makes the years cheap too.
