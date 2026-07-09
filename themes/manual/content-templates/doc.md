---
title: Replace this — the section title as it should appear in the sidebar
order: "10"
description: Replace this — one sentence shown in the docs index, search results, and under the page title.
prev: /docs/previous-section/
prevTitle: Previous section's title
next: /docs/next-section/
nextTitle: Next section's title
---

Replace this paragraph: state in two sentences what this section covers and what the reader will be able to do at the end of it.

**How the manual is wired together (delete this block once set up):**

- `order` positions this page in the sidebar and the docs index. Always quote it (`"10"`, not `10`) so `"02"` sorts before `"10"`. Leave gaps (10, 20, 30…) so you can insert sections later without renumbering.
- `prev` / `next` draw the sequence links at the bottom of the page. They are plain URL paths; `prevTitle` / `nextTitle` are their labels. **Delete the `prev` pair on your first section and the `next` pair on your last** — and remember to update the neighbours when you insert a page between them.

## Replace this — first task or concept

Explain one thing. Show, don't tell — a short command or config example beats a paragraph:

```sh
replace-this --with "a real command the reader can run"
```

Then say what the reader should see when it works.

## Replace this — second task or concept

Keep sections small enough to skim. Use a table when values need comparing:

| Replace  | With                    |
| -------- | ----------------------- |
| A column | Of real, useful values  |

> **Tip** — Blockquotes render as callout panels. Start one with a bold word — **Tip**, **Note**, **Warning** — to give it a title.

## Where to next

End by pointing somewhere: the next section in the sequence, or a related page like [another section](/docs/next-section/).
