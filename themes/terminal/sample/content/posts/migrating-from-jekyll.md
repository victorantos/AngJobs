---
title: Migrating this blog from Jekyll to plain
date: 2026-06-14
description: "Eleven years of posts, one afternoon, zero broken URLs. What moved cleanly, what didn't, and the redirect file that matters more than the theme."
tags:
  - meta
  - tooling
example: true
---

This blog ran on Jekyll from 2015 until last week. Jekyll never broke — that's not why I moved. I moved because my publishing flow had decayed into: clone on whatever machine I'm on, hope the right Ruby is installed, `bundle install`, watch something native fail to compile, give up, write the post next month.

plain's pitch is that content is Markdown files in the repo and the *admin is a static page* that commits through the GitHub API. No local toolchain to resurrect. That fixed the actual problem.

## The mechanical part

The importer did most of it:

```sh
node tools/migrate/jekyll.js ~/src/old-blog .
# 214 posts converted
# 87 media files copied
# 214 redirects written to data/redirects.json
```

Frontmatter came across nearly untouched — `title`, `date`, `tags` mean the same thing in both worlds. Three things needed hand-work:

- **Liquid tags.** A dozen posts used `{% highlight %}` blocks; the importer converts them to fenced code, but two had `{% raw %}` nesting it flagged for review instead of guessing.
- **Drafts.** Jekyll's `_drafts/` folder became `draft: true` frontmatter. Eleven drafts from 2019 did not survive the editorial review they never deserved.
- **The permalink format.** I had `/:year/:month/:title/` URLs. plain wants `/blog/:slug/`.

## Redirects are the migration

That third point is the one that matters. Eleven years of inbound links point at the old URL shape, and silently changing URLs torches your search traffic and everyone's bookmarks. The importer's non-negotiable output is a complete old→new map:

```sh
head -3 data/redirects.json
# {
#   "/2015/03/hello-world/": "/blog/hello-world/",
#   "/2015/04/postgres-explain/": "/blog/postgres-explain/",
```

plain turns that into a `_redirects` file for the host plus meta-refresh fallback pages, so the redirects work even on dumb static hosting. I spot-checked the twenty most-trafficked URLs from analytics; all 301 correctly.

## Verdict

The afternoon budget: importer ten minutes, redirect spot-checks an hour, fussing with the theme the rest. Publishing this post was `git push`. That's the whole review.
