---
title: Subscribe
description: New letters by email, the morning they're finished. Nothing else, ever.
example: true
---

New letters arrive by email the morning they're finished — every few weeks,
occasionally sooner, never more than one at a time. No digests, no
announcements, no "just checking in." Unsubscribing is one click and no hard
feelings.

If the form below isn't showing, the newsletter isn't wired up yet: open
`data/newsletter.json` and set `formAction` to your email provider's form
endpoint — Buttondown (`https://buttondown.com/api/emails/embed-subscribe/you`),
Mailchimp's embedded-form URL, or any service that accepts a plain HTML form
POST with an `email` field. The prompt and button label live in the same file.

Prefer a feed reader? The [RSS feed](/blog/rss.xml) carries every letter in
full, the moment it's published.
