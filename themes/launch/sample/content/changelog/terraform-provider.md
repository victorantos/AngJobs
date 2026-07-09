---
title: Official Terraform provider
date: 2026-04-17
version: v2.1.0
tag: New
description: Monitors, status pages, and rotations as code — plan, review, apply. The clickers lose nothing; the coders stop clicking.
example: true
---

Everything you can click is now a resource: monitors, assertion sets,
status pages, escalation rotations. `terraform plan` shows exactly what an
on-call change does before it does it, which is how on-call changes should
work everywhere, forever.

State drifts both ways: changes made in the dashboard show up as diffs,
so teams migrating gradually aren't punished for touching the UI during
an incident.

The provider is on the registry as `pulse/pulse`, versioned independently
of the app. Our own production config moved to it three months ago —
release v2.0.3 was, in its entirety, "fix the bug we found doing that."
