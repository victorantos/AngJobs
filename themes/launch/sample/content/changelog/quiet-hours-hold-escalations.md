---
title: Quiet hours now hold non-customer-facing escalations
date: 2026-06-12
version: v2.3.2
tag: Improved
description: Overnight, incidents that aren't customer-facing wait for morning unless they cross your impact threshold — the 3am page is reserved for pages worth 3am.
example: true
---

Quiet hours previously delayed first alerts but not escalations, which
meant a flapping internal check could still walk up your rotation at 3am.

Now the impact threshold applies to the whole escalation chain: overnight,
anything below **customer-facing** waits for your morning window, arrives
as a digest, and says how long it's been waiting. Anything at or above the
threshold pages exactly as before — this change buys sleep, not risk.

The digest has been the most-requested change of the year. It took us too
long because we kept trying to make it clever; it shipped the week we made
it boring.
