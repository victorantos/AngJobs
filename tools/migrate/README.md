# Move your existing blog to plain

This folder holds plain's **importers** — local scripts that convert an
existing site into plain content. (Landed here from `migrations/` and
wondering about the similar name? That folder holds the engine's own upgrade
scripts, run automatically when plain itself updates — this one is for
*your* site.)

Jekyll and VuePress ship today; Hugo, Eleventy, and WordPress are on the
roadmap (cms-spec.md §15). Each importer is one dependency-free file
(`jekyll.js`, `vuepress.js`) — so adapting one to another generator is a
realistic afternoon project, or a one-prompt task for an AI agent.

## Before you start

- **Node 18+** (`node --version`).
- **A plain site to import into.** Easiest: click **"Use this template"** on
  the plain repository and clone your new repo. Any clone of plain works.
- **Your old site's folder on disk**, e.g. `~/blog`. The importer only reads
  it — it never writes there.

## Step 1 — run the importer

From your plain repo's root:

```sh
node tools/migrate/jekyll.js /path/to/your-jekyll-site
```

Everything is written into `./plain-import/` — never into your old site or
your plain repo — so you can rerun it as often as you like while you tune
the flags:

- `--permalink=/your/:pattern/` — your Jekyll permalink template, if it
  isn't declared in `_config.yml`. Chirpy-theme sites are detected
  automatically (posts at `/posts/:title/`, pages in `_tabs/`).
- `--pages=dir1,dir2` — extra folders holding pages beyond the top level and
  `_pages/`. Say your site keeps landing pages under `business/`:

```sh
node tools/migrate/jekyll.js ~/blog --pages=business
```

**Coming from VuePress?** Same shape, different flags — point it at the
folder that contains `.vuepress/`:

```sh
node tools/migrate/vuepress.js /path/to/site/src
```

- `--collections=jobs,docs` — which top-level folders become collections
  (default: any folder holding 2+ pages). Subfolders flatten into the
  collection with a `section` field and a matching tag, so plain's tag pages
  replace per-folder index pages.
- `--component='JobApplication=[[form:apply]]'` — what to put where a Vue
  component stood (repeatable; default strips it and lists it in the report's
  components table so you can rerun with a substitution).
- `--base=/subpath/` — only if your `.vuepress/config` sets a `base` the
  importer can't read.

VuePress notes: plain URLs always end in `/`, so `.html` URLs can never be
preserved — the generated redirect map is the answer, not a loss. `::: tip`
containers become blockquotes; nested frontmatter (e.g. `author: {name,
url}`) is flattened to `author` + `authorUrl`; `.vuepress/public/` assets
move to `/media/public/` with references rewritten.

## Step 2 — read the report

Open `plain-import/MIGRATION-REPORT.md`. It lists what converted, the
complete old→new URL map, and a **review queue** — everything the importer
refused to guess at (stripped Liquid tags, HTML-only pages, missing dates).
Each queue entry is a ready-to-run task for you or for an AI agent; pasting
one into Claude Code usually resolves it in a single prompt.

## Step 3 — copy the results in

```sh
cp -R plain-import/content/. content/
cp -R plain-import/media/. media/                      # if media/ was created
cp plain-import/data/redirects.json data/redirects.json
```

If your plain repo already has redirect entries, merge the two JSON files
instead of overwriting.

## Step 4 — decide your URLs

The importer maps posts to plain's default `/blog/<slug>/` and records a
redirect for every URL that changed. Two good options:

- **Keep your old URLs** (zero SEO risk). Set the posts collection's
  `urlPattern` in `site.config.json` to the old scheme — a Chirpy site uses
  `"urlPattern": "/posts/:slug/"` — and post URLs come out identical. Then
  **remove the matching entries from `data/redirects.json`**: each one now
  points away from a live page.
- **Adopt plain's defaults.** Keep `/blog/:slug/` and ship the generated
  redirects — plain emits both a `_redirects` file and meta-refresh fallback
  pages, so they work on any host.

Either way: never delete a redirect whose old and new URL still differ.
Those entries are your search ranking and every link anyone ever shared.

## Step 5 — site.config.json

The imported content uses these fields; a minimal config that matches:

```json
{
  "site": { "title": "My Blog", "url": "https://example.com" },
  "collections": {
    "pages": {
      "path": "content/pages", "urlPattern": "/:slug/", "template": "page",
      "fields": [
        { "name": "title", "type": "text", "required": true },
        { "name": "description", "type": "text" },
        { "name": "draft", "type": "boolean", "default": false }
      ]
    },
    "posts": {
      "path": "content/posts", "urlPattern": "/blog/:slug/", "template": "post",
      "listUrl": "/blog/", "listTemplate": "list",
      "sortBy": "date", "sortOrder": "desc", "rss": true,
      "fields": [
        { "name": "title", "type": "text", "required": true },
        { "name": "date", "type": "date", "required": true },
        { "name": "description", "type": "text" },
        { "name": "cover", "type": "image" },
        { "name": "tags", "type": "list" },
        { "name": "draft", "type": "boolean", "default": false }
      ]
    }
  }
}
```

If the build rejects something, the error names the file, the problem, and
the fix — follow it literally.

## Step 6 — navigation

Edit `data/navigation.json` to mirror your old menu:

```json
[
  { "label": "Home", "url": "/" },
  { "label": "Blog", "url": "/blog/" },
  { "label": "About", "url": "/about/" }
]
```

## Step 7 — dynamic features

Static sites lean on services for the moving parts. Where each goes:

| On your old site | In plain |
| --- | --- |
| Contact form | `contact-form` plugin → Formspree or your own endpoint |
| Forms posting to your own backend | `api-form` plugin + a `"services"` entry (CLAUDE.md, "services") |
| Analytics | `goatcounter` plugin (opt-in), or leave analytics out |
| Vue components in Markdown | `--component` substitutions (forms → `api-form`) or the report's review queue |
| Comments | giscus (GitHub Discussions) as a plugin, or a static archive |
| Search, RSS, sitemap, tag pages | built in — nothing to do |

## Step 8 — theme, build, verify

```sh
node build.js --watch     # builds + serves on http://localhost:4000
```

Click through your pages. Open one with JavaScript disabled — it must still
read fine (plain's rule C5, now your site's superpower). Restyle from the
admin's Appearance screen — the theme try-on renders *your* content — or by
editing the tokens at the top of the theme's `theme.css`. Then:

```sh
node --test tests/
```

## Step 9 — deploy and cut over

1. Commit and push; `.github/workflows/build-deploy.yml` publishes the site.
2. Point your domain at the new host (or flip the Pages setting).
3. Spot-check two or three *old* URLs — each should land on the right page.
4. Keep the old repo until everything checks out. Rollback is `git revert`,
   not archaeology.

## Troubleshooting

- **Build fails with `file:line — problem — fix`** — that's validation doing
  its job; make the edit it names.
- **A post reads oddly** — check the review queue; posts that were HTML in
  Jekyll are kept as raw HTML and deserve a skim.
- **A post is dated 1970-01-01** — the source had no date anywhere; set one
  in its frontmatter.
- **A page lost its hero/landing layout** — VuePress `home: true` layouts are
  theme features, not content; the review queue quotes the dropped hero
  values so you can rebuild them as plain Markdown/HTML.
- **Coming from Hugo, Eleventy, or WordPress?** Export to Markdown with
  frontmatter and the Jekyll importer gets you most of the way — or adapt
  `jekyll.js`/`vuepress.js` to read your generator's layout directly.
