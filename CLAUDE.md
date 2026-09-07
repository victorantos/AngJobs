# CLAUDE.md — how to work on this repo

This is **plain**, a Git-native CMS: content is Markdown files, configuration is JSON, the build emits a static site into `dist/`. The full spec is `cms-spec.md` — read it before structural changes. This file is the working reference for day-to-day edits.

## The one rule

**Before committing, always run both:**

```sh
node --test tests/
node build.js
```

A red test or a failed build must never be committed. The golden-file test compares built output byte-for-byte; if you intentionally changed output, run `node tests/update-goldens.js` and review the diff.

## Hard constraints (from cms-spec.md §2 — never violate)

- Vanilla only: no frameworks, no bundlers, no TypeScript. Plain ES modules, JSDoc for types.
- Exactly one runtime dependency: `marked`. No new packages, including dev dependencies.
- Core (`build.js` + `lib/` + admin JS) stays under 3,000 lines; no file over 500. Too big → make it a plugin.
- No database. All state is files in this repo.
- The published site must work with JavaScript disabled.
- `lib/util.js`, `lib/template.js`, `lib/markdown.js`, `lib/i18n.js` are **isomorphic**: they must never import `node:*` — the admin runs them in the browser so previews match the build exactly.

## Commands

| Command | What it does |
| ------- | ------------ |
| `node build.js` | Build the site into `dist/` |
| `node build.js --watch` | Build, serve on :4000, rebuild on change |
| `node --test tests/` | Run the test suite |
| `node tests/update-goldens.js` | Regenerate golden files after an intentional output change |

## Content model

Collections are defined in `site.config.json`. A collection = a folder of `.md` files + a field schema:

```json
"posts": {
  "path": "content/posts",        // folder of .md files
  "urlPattern": "/blog/:slug/",   // must start with / and contain :slug
  "template": "post",             // theme template for one item
  "listUrl": "/blog/",            // optional: emit a paginated list page
  "listTemplate": "list",         // required if listUrl is set
  "label": "Blog",                // optional: heading for list pages
  "sortBy": "date", "sortOrder": "desc",
  "pageSize": 10,                 // pagination size for list pages
  "rss": true,                    // emit <listUrl>rss.xml
  "fields": [
    { "name": "title", "type": "text", "required": true },
    { "name": "date",  "type": "date", "required": true },
    { "name": "draft", "type": "boolean", "default": false }
  ]
}
```

Field types: `text`, `textarea`, `date`, `boolean`, `image`, `list`, `select` (needs `options`). The admin renders its edit forms from this schema, so **adding a field to config is the whole job** — no code changes.

**`render: false`** (optional) makes a **data-only collection**: scanned, schema-validated, sorted, and admin-editable exactly like any other, and exposed to templates as `collections.<name>`, but it emits **no** item pages or list page — so it needs no `urlPattern`, `template`, or `listUrl`. Use it for repeated home-page sections (feature cards, FAQ entries, testimonials, pricing tiers) where each entry is one editable `.md` file with no URL of its own. Items still get `api/<name>/…` JSON (their `url` is `null`) but are excluded from the sitemap, search index, and `llms.txt`. Order them with a numeric `order` field plus `"sortBy": "order", "sortOrder": "asc"`; render them with `{{#each collections.<name> as item}}…{{/each}}` in the page template that needs them.

**`site.basePath`** (optional): serve under a subpath, e.g. GitHub *project* Pages at `/<repo>/`. The build prefixes every root-relative `href`/`src` (and redirect target) with it; set `site.url` to the full base too (`https://user.github.io/<repo>`). Leave it empty (default) for a site served at the domain root — user Pages, Cloudflare/Netlify, or a custom domain.

**`site.oauthUrl`** (optional): the deployed OAuth Worker URL (`workers/oauth/`). When set, the admin sign-in screen shows a **"Sign in with GitHub"** button (the paste-a-token form moves under "or use an access token"); writers with repo write access click it, authorize once, and publish — no PAT. Leave it out for token-only sign-in (v1). The admin opens `<oauthUrl>/login` in a popup and accepts the token only from a `postMessage` matching that origin.

**`site.demo`** (optional, default `false`): turn the admin into a try-it-first demo (§8.6). The sign-in screen leads with **Try the editor**, and `/admin/?demo=1` drops a visitor straight in with no account: `admin/js/demo.js` stands in for the GitHub API with a repository held in `sessionStorage`, seeded from the site's own `api/site.json` + `api/<collection>/index.json` (they already carry every item's raw Markdown). Editing, publishing, the build pill, History and Restore all really run; nothing leaves the tab, a real sign-in on the same device is untouched, and the site pays nothing (no GitHub calls, no keys). Off by default — `demo.js` isn't even fetched — and this repo's own `site.config.json` sets it because this repo is the public demo. Remove it on a site that doesn't want the button.

**`site.favicon` / `site.appleTouchIcon` / `site.socialImage`** (optional): per-site branding without editing a theme. `favicon` swaps the icon link away from the theme's `/assets/favicon.svg`; `appleTouchIcon` adds an iOS home-screen icon link; `socialImage` is the site-wide share image — every theme emits it as `og:image` + `twitter:card` for pages that have no `cover`. Values are root-relative paths served from `media/` (e.g. `/media/brand/og-image.png`); meta tags absolutize them with `site.url`. The project's brand kit (SVG masters + generator + platform rasters) lives in the site repo, `victorantos/plain-cms.com`, under `assets/` — this engine repo ships only the default favicon and the README logos in `.github/`.

**`services`** (optional, top-level beside `plugins` — not inside `site`): the site's named backend endpoints, e.g. `"services": { "backend": "https://api.example.com" }`. Plugins resolve a service by name instead of hardcoding URLs: build hooks read `site.config.services`, client code reads the reserved `$services` key of the injected plugin-options JSON (see Plugins below). Values must be `https://` URL strings (validated; trailing slash stripped) and are public three times over — committed in the repo, injected into every page that loads plugin JS, served in `api/site.json`. **Endpoints only, never keys or secrets**; anything private follows the BYOK/localStorage pattern (§8.3, `admin/js/ai.js`). `plugins/api-form/` is the reference consumer.

**To add a collection:** add an entry to `collections`, create its folder under `content/`, and make sure the theme has the template it names. That's all.

### Content files

Markdown with frontmatter. The frontmatter parser is a deliberate, hand-rolled subset — only these forms are legal:

```markdown
---
title: Plain scalar value          # string; true/false → boolean; 42 → number
quoted: "kept as a string"         # quotes force string
date: 2026-07-05                   # dates are ISO strings, validated by field type
tags:                              # a list: "key:" then indented "- item" lines
  - launch
---
Body in Markdown.
```

No nesting, no multiline strings, no YAML anchors. Unknown extra keys are allowed (e.g. `example: true` marks sample content).

Rules:
- **Filename = slug = URL.** `hello-world.md` → `/blog/hello-world/`. Filenames must be lowercase slugs. `index.md` maps to the collection's URL root (`/` for pages).
- **Renaming a file changes its URL** — add the old URL to `data/redirects.json`: `{ "/old-url/": "/new-url/" }`.
- `draft: true` excludes the item from the build entirely (pages, sitemap, RSS).
- Validation failures stop the build with `file:line — problem — fix`. Broken content never half-deploys.

### Data files

Every `data/*.json` is available to templates as `data.<filename>` (e.g. `{{#each data.navigation as entry}}`). `navigation.json` is a list of `{label, url}`; `redirects.json` maps old → new URLs and produces both a `_redirects` file and meta-refresh fallback pages. `footer.json` is `{ "html": "…" }` — every shipped theme prints it at the bottom of every page (raw site-owner HTML), and the admin's Settings screen edits it (commit message `settings: update footer`).

### Multilingual sites (i18n — spec §5.4, `lib/i18n.js`)

Off by default: i18n activates only when `site.languages` lists 2+ lowercase codes **and** includes `site.language` (e.g. `"languages": ["en", "fr"]`; `config.defaults.json` ships `[]`). Set them in the admin's **Settings → Additional languages** (or by hand). Every i18n code path short-circuits when the list is empty — a monolingual build is byte-identical.

- **Translations are sibling files:** `about.fr.md` next to `about.md` (slug = filename minus `.<lang>.md`) renders to `/fr/about/`; default-language URLs never change. No ghost pages: `/fr/about/` exists only if `about.fr.md` does; list/tag pages, RSS, `llms.txt`, and the 404 stay default-language only.
- **Merged views:** a page rendering in language L sees `collections.<name>` with each item's L variant where one exists, else the default item — lists and data-only collections are always complete. Nav URLs localize per entry only when the target translation exists; nav **labels** translate via `data/navigation.<lang>.json` (a per-language `[{label, url}]` matched on the default url, per-entry fallback). `base.html` emits an `hreflang` link per available language version (the `alternates` variable).
- **UI strings:** themes say `{{ strings.readMore }}`; the dictionary merges per key: engine defaults in `lib/i18n.js` ← theme `strings.json` ← `data/strings.<default>.json` ← `data/strings.<lang>.json` (missing keys fall back to the default language). Only `themes/default/` is converted; other themes keep hardcoded English until converted.
- **Outputs when active:** sitemap gains translated URLs; API items carry `language`; translated items publish as `api/<collection>/<slug>.<lang>.json` and originals list `translations: ["fr", …]`; search-index entries gain `lang`. Dates format per item language.
- **Build errors (all name the file):** unknown language suffix, translation without an original, a default slug that shadows a language code (a page slugged `fr`). A drafted original drafts its translations.
- **Admin:** the editor's Translate button offers the configured languages and writes `slug.<lang>.md` as a draft; the slug field edits only the base name so the suffix survives renames.

## Template syntax (lib/template.js — the complete list)

```
{{ item.title }}                      escaped output (dot-paths only, no JS)
{{{ page.content }}}                  raw output, for rendered HTML
{{#if page.draft}} … {{else}} … {{/if}}    truthy test; an empty list is false
{{#each items as item}} … {{/each}}   iterate a list, alias in scope
{{> post-card}}                       partial from templates/partials/
```

Variables available in every template:

- `site` — the `site` block of config (`site.title`, `site.url`, …)
- `page` — the current item: its fields plus `url`, `slug`, `content` (rendered HTML), `body` (raw Markdown), `dateFormatted`, `tagLinks` (`[{name, url}]`)
- `nav` — navigation entries with `current: true` on the active one
- `data` — all data files; `collections` — all items by collection name
- `feeds` — RSS feed URLs (for `<link rel="alternate">`)
- `strings` — the UI-string dictionary for the page's language (see i18n above); `alternates` — `[{lang, url}]` hreflang links, only on pages with translations
- List templates also get: `items` (this page's slice), `pagination` (`page`, `totalPages`, `multiple`, `newer`, `older`), `tag` (on tag pages)

Every page template renders into `base.html`'s `{{{ body }}}` slot.

## Landing / sales pages

A **landing page** is any content item rendered with the theme's `landing` template — a marketing page with a hero, a call-to-action button, and repeatable "sales sections" (features, testimonials, FAQ, and — on themes that ship it — pricing). It is core content + theming, **not** a plugin: it must work with JavaScript off (C5), so nothing about the page depends on client JS.

**Per-page template override.** Any item's frontmatter may set `template:` to override its collection's template; the build resolves `item.template || collection.template`, falling back (with a warning, never a failure — §10.4) if the theme lacks that template. So a landing page is just a normal `pages` item with `template: landing`, and the home page becomes a landing page by setting `template: landing` on `content/pages/index.md`. `themes/default/` and `themes/launch/` both ship a `landing` template; a theme advertises its selectable page layouts via `"layouts": [...]` in `theme.json` (the admin editor's **Layout** picker reads it).

**Hero & CTA come from frontmatter** (the landing template reads these `page.*` fields): `heroTagline`, `heroCtaLabel`/`heroCtaUrl`, `heroSecondaryLabel`/`heroSecondaryUrl`, `heroImage`/`heroAlt`, the section headings `featuresHeading`/`testimonialsHeading`/`faqHeading`/`pricingHeading`, and the closing `ctaHeading`/`ctaLabel`/`ctaUrl`. To edit these as **forms** (not raw frontmatter), add them as fields to the collection's schema and tag each `"showFor": "landing"` so they appear only when the Layout is Landing (editor-only metadata — the build ignores it). Every CTA the template emits carries a `data-cta="…"` hook (`hero`, `hero-secondary`, `footer`, `plan-<name>`) for the **sales-analytics** plugin (see Plugins).

**Sections are `render: false` collections.** `features`, `testimonials`, `faq` are data-only collections (one editable `.md` per entry, ordered by a numeric `order` field); the landing template loops them and **each section hides when its collection is empty**, so an un-provisioned landing page is just the hero. Pricing on `launch` comes from `data/pricing.json`. To add landing capability to a site on any theme, add the section collections and (optionally) hero fields to `site.config.json`:

```json
"features":     { "path": "content/features",     "render": false, "sortBy": "order", "sortOrder": "asc", "label": "Features",     "fields": [{ "name": "title", "type": "text", "required": true }, { "name": "order", "type": "text" }] },
"testimonials": { "path": "content/testimonials", "render": false, "sortBy": "order", "sortOrder": "asc", "label": "Testimonials", "fields": [{ "name": "author", "type": "text" }, { "name": "role", "type": "text" }, { "name": "order", "type": "text" }] },
"faq":          { "path": "content/faq",          "render": false, "sortBy": "order", "sortOrder": "asc", "label": "FAQ",          "fields": [{ "name": "title", "type": "text", "required": true }, { "name": "order", "type": "text" }] }
```

**Authoring UX:** "New page → **Landing**" starts from `themes/<theme>/content-templates/landing.md` (seeds `template: landing` + the hero fields); the editor's Layout picker flips an existing page into a landing page. The `launch` starter installs the section collections and a sample landing page, so applying it gives a working sales page out of the box.

## The admin (`admin/`)

A vanilla single-page app served at `/admin/` on the published site. It reads
the static API (`/api/site.json` for the schema, `/api/<collection>/index.json`
for published items) and writes through the GitHub contents API — every save
is a commit; there is no other backend.

- `js/github.js` — GitHub REST calls, token in localStorage (never sent anywhere but api.github.com)
- `js/app.js` — router + dashboard, collection lists, navigation editor, settings, sign-in
- `js/editor.js` — the schema-driven editor: fields come from config (empty optional ones fold into “More fields”), preview renders with `lib/markdown.js` inside an iframe carrying the site's theme + plugin CSS, so it looks like the page it will become
- `js/media.js` — media library + uploads to `media/YYYY/MM/` (≤5 MB, resize offer over 1 MB)
- `js/ui.js` — DOM helpers, toasts, dialogs, the build-status pill
- `js/demo.js` — the `site.demo` sandbox: the same GitHub REST paths answered from an in-tab repository, so anyone can try the admin with no account (loaded on demand — a signed-in site never fetches it)

The build copies `admin/` plus the isomorphic lib modules and `marked` into
`dist/admin/` — the editor preview and the build share one renderer (§10.2).
UI language rule: never show Git words. Say Save / Publish / History / Restore.
Commit messages it writes: `post: publish "Title"`, `page: edit "About"`,
`media: add lake.jpg`, `navigation: update menu`, `settings: update site settings`.

## The static API (`dist/api/`)

- `api/site.json` — `{site, collections, plugins, services, navigation}` (the machine-readable content model)
- `api/<collection>/index.json` — `{items: [...]}`, sorted like the site
- `api/<collection>/<slug>.json` — one item: frontmatter fields + `url`, `slug`, `file`, `body` (Markdown), `content` (HTML). Exception: an item named `index.md` has no per-item file (it would collide with the listing above, which carries every item in full).

Drafts never appear in the API. Any script or agent can consume these without a server.

The build also emits `llms.txt` (title, summary, and a link list per collection — the llms.txt convention) so AI agents can survey the site in one request.

## AI assist (admin/js/ai.js)

Editor-facing AI (§8.3): a provider interface `complete(prompt, content) → text` with an Anthropic adapter calling `/v1/messages` directly from the browser (BYOK — key pasted in Settings, kept in localStorage, sent only to api.anthropic.com). Five actions in `assist`: `improve`, `describe`, `titles`, `altText` (vision), `translate`. Rules: every action shows a before/after review and requires an explicit Apply — never auto-apply; without a key the buttons explain how to add one; no `temperature`/`thinking` params (removed on current models — they 400).

Because content is plain files, **any agent workflow works with zero integration**: Claude Code writing a weekly post, an Action drafting a changelog PR, a scheduled agent updating a prices page. The tests protect this — an agent that breaks the schema gets a failing build with a clear message, not a broken site.

## Agent skills (`.claude/skills/`)

The other half of "AI is the admin" (§8.4): a site owner who opens their repo in
Claude Code should be able to say *"write a post about X"* and have it land
correctly. This file is the **engine reference**; the skills are the **operating
recipes**, loaded only when a task matches so a writer never pays for the plugin
API in context.

| Skill | Covers |
| ----- | ------ |
| `plain-post` | write / edit / publish / unpublish / translate a post or page |
| `plain-site` | media, menu, footer, settings, redirects, theme, plugins, languages, deploys |
| `plain-extend` | add a field or collection, a layout, a plugin, a starter; upgrades and imports |

`.claude/settings.json` ships a small permission allowlist (build, test, inspect
— never commit or push) so a fresh site repo isn't a wall of prompts.

Rules for editing them:

- **Recipes, not reference.** A skill holds the order to do things in, the exact
  commands, and the traps. Anything reference-shaped belongs here in `CLAUDE.md`
  and the skill links to it — duplicated docs rot.
- Every skill ends at the same gate: `node --test tests/` and `node build.js`.
- `tests/skills.test.js` enforces the frontmatter, the cross-references, and that
  every engine path and npm script a skill names still exists. It ships into user
  sites, so skills must never depend on sample content a site is free to delete.
- Skills are engine-owned: after editing one, run `node tools/engine-manifest.js`.

## Themes & starters

A theme is `themes/<name>/` with `templates/` (`base.html`, plus whatever templates collections name), optional `templates/partials/`, and `assets/` (copied to `/assets/`). All design decisions are CSS custom properties in one `:root` block at the top of `theme.css` — restyle by editing tokens, never selectors. Quality floor: semantic HTML, WCAG AA, visible focus, light + dark scheme, print stylesheet, no external requests, system fonts only.

A **starter** (§10.3) is a theme plus an optional `starter.json` declaring the collections, navigation preset, and `sampleContent` folder it installs. Applying a starter merges its `collections` into config, sets navigation, and copies `sample/**` (all `example: true`) into the site — each a commit. A theme may also ship `content-templates/*.md` (pre-structured "New post" starting points) and, via `config.theme.tokens`, per-token customizations that the build injects as a `<style id="theme-tokens">` block **after** `theme.css` — so upgrades replace theme files wholesale while customizations survive (§10.5). Ships with fifteen starters: `default` (Journal), `toolbox` (trades), `studio` (portfolio), `bistro` (restaurant), `manual` (docs), `terminal` (developer blog), `letters` (newsletter/essays), `launch` (startup/SaaS), `gazette` (news/magazine), `folio` (résumé/CV), `keys` (real estate), `cause` (nonprofit), `practice` (clinic), `form` (fitness), `encore` (band/artist). A starter may also declare `"plugins": ["github-stars", …]` — on apply, each is enabled and, if not already installed, fetched from the plugins registry (so `terminal` ships with `github-stars` on).

The admin's Appearance screen renders a **try-on** of the user's own pages with a candidate theme entirely in the browser, using the same `lib/template.js`/`lib/markdown.js` the build uses (§10.2) — nothing is committed until Apply. `admin/js/appearance.js` also reads the community starter registry (§10.6). The first-run wizard (`admin/js/wizard.js`) runs when the config still has the placeholder title `"My Site"`.

## Plugins — the AI extension surface

**A plugin is a folder in `plugins/`. Install = copy the folder + add its name to `"plugins"` in `site.config.json`.** No npm, no registry, no build step. This section is the complete API.

```
plugins/my-plugin/
├── plugin.json     # manifest (required)
├── index.js        # build-time hooks (optional)
├── client.js       # browser module, auto-injected into every page (optional)
└── client.css      # stylesheet, auto-injected into every page (optional)
```

`plugin.json`:

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "One sentence.",
  "hooks": ["transformContent"],
  "client": { "js": "client.js", "css": "client.css" },
  "options": { "someOption": "default value" }
}
```

Only `name`, `version`, `description` are required. `hooks` is documentation (the loader inspects `index.js` itself). Declare `client` entries only for files that exist. An optional `note` string is shown on the plugin's admin card — use it to state a prerequisite (e.g. language-switcher's "needs 2+ languages — set them in Settings").

**Installing from the registry.** Authoring a plugin needs no registry — but for *sharing*, the admin's **Plugins** screen (`admin/js/plugins.js`) installs community plugins from the curated `plain-cms/plugins` registry: Install copies the folder into `plugins/<id>/` + enables it in `site.config.json` (one commit), Configure edits `pluginOptions.<id>`, Remove reverses both. It also surfaces **built-in plugins present in `plugins/` but not enabled** (a new one shipped by an update, or any where the site's own `plugins` array overrides the defaults) with a one-click **Enable**. Registry entries carry `runsAt` (`client`|`build`|`both`) + `author` so the UI shows where a plugin runs and its provenance (plugins are code — the screen says so). Community plugins are user-owned (never in `engine.json`) and survive upgrades. Starters bundle plugins by id (see Themes & starters); `admin/js/appearance.js` `applyStarter()` fetches any that aren't already installed.

`index.js` default-exports an object of hooks. All are optional; each may be sync or async. **Every hook receives the plugin's resolved options as its last argument** (manifest `options` overridden by the site's `pluginOptions.<name>` in `site.config.json`):

```js
export default {
  // After config load, before content is scanned. site = {config, data, collections: null}.
  init(site, options) {},

  // Once per content item, after frontmatter parsing, BEFORE Markdown rendering.
  // Mutate the item freely: item.body is raw Markdown; fields (title, date, …)
  // are set; item.url/slug/file/collection too. Anything you add rides along
  // into templates and the JSON API (e.g. item.readingTime = …).
  transformContent(item, site, options) {},

  // Once per rendered HTML page (items, list pages, the 404). Return a string
  // to replace the page's HTML; return nothing to leave it unchanged.
  // page = the template context's page object (item or {title, url}).
  renderPage(page, html, site, options) { return html; },

  // After everything is written to dist/. Emit extra files here.
  // site.renderPage(templateName, context) renders a themed page for you:
  //   site.renderPage('page', {page: {title: 'X', url: '/x/', content: '<p>…</p>'}})
  afterBuild(distPath, site, options) {},
};
```

Rules:
- `site` is `{config, data, collections, renderPage}` — `collections` is filled after `init`.
- A plugin that throws fails the whole build, with the plugin's name in the error.
- Client assets publish to `/plugins/<name>/…` and are injected into every page in config order (`css` before `</head>`, `js` as a module before `</body>`). Client code reads its options from the injected JSON: `JSON.parse(document.getElementById('plugin-options').textContent)["my-plugin"]`. The site's named backend endpoints ride along under the reserved `$services` key — resolve a service as `(opts.$services || {})[opts["my-plugin"]?.service || "backend"]`; never hardcode a backend URL in a plugin.
- Client JS must be progressive enhancement — the page must work without it (C5).
- The build also emits `search-index.json` (`[{url, title, description, tags, text}]`) — plugins may consume it.
- Study `plugins/search/` (afterBuild + client), `plugins/contact-form/` (renderPage + options), and `plugins/api-form/` (config-declared forms POSTing to a named service, `services` + progressive enhancement) as reference implementations.
- `plugins/backend-admin/` is a parked **user-owned** draft (the victorantos.com backend dashboard) awaiting migration to that site's repo — not engine-owned, not in `engine.json`, never enabled in this repo's config.

**Checklist for a new plugin:** create the folder + `plugin.json` (+ `index.js`/client files) → add its name to `"plugins"` in `site.config.json` → `node build.js` → check the output in `dist/` → `node --test tests/`.

## Build pipeline (build.js)

config → load plugins → data → `init` hooks → content (validate) → `transformContent` hooks → Markdown → templates → client-asset injection → `renderPage` hooks → outputs (`sitemap.xml`, per-collection `rss.xml`, `robots.txt`, `_redirects` + fallback pages, `404.html`, `api/`, `search-index.json`, `llms.txt`) → copy `media/` + theme assets + plugin client assets + admin → `afterBuild` hooks. The build is deterministic: same files in, same bytes out (golden tests depend on this — never use the current time in outputs).

## Upgrade system (§14) — `tools/`, `migrations/`, `engine.json`

Upgrades are pull requests built by **wholesale file replacement**, never a merge. Ownership contract (§14.1): engine-owned = `build.js`, `lib/`, `admin/`, `themes/default/`, `config.defaults.json`, the workflows, `tools/`, `migrations/`, `plugins/{search,contact-form,reading-time,api-form,goatcounter,reset-sw,language-switcher,sales-analytics,feedback,static-root}`, `.claude/skills/`, `.claude/settings.json`. User-owned = `content/`, `data/`, `media/`, `site.config.json`, custom themes/plugins. Never hand-edit an engine file in a user's site — copy the default theme to `themes/custom/` first.

- `engine.json` — `{version, migration, files: {path: sha256}}`, generated by `node tools/engine-manifest.js`. **Regenerate it whenever you change an engine file, before a release.**
- `config.defaults.json` — engine defaults deep-merged *under* the user's sparse `site.config.json` at build time (§14.3, `deepMerge` in `lib/util.js`). New features ship with working defaults without touching the user's file.
- `tools/update.js` — the updater. For each engine file: if the local hash matches the *installed* manifest it's replaced; if it differs the user modified it, so it's left and flagged for manual/AI merge. Runs `migrations/NNN-*.js` between the installed and target levels. Emits a PR-ready report.
- `migrations/NNN-description.js` — idempotent plain-Node scripts for breaking changes (see `migrations/README.md`).
- `.github/workflows/update.yml` — `workflow_dispatch` (from the admin's update banner) + weekly cron: fetch upstream, run the updater, test + build, open a PR.

## Importers (§15) — `tools/migrate/`

Local CLIs, plain Node, outside the core dependency budget. `node tools/migrate/<source>.js <input> [outDir]` writes `content/`, `media/`, and — non-negotiably — a complete old→new `data/redirects.json`, plus a migration report. `tools/migrate/jekyll.js` is the reference (Jekyll → plain: frontmatter remap, Liquid stripping, permalink-based redirects); `tools/migrate/joomla.js` covers the crawl path (live site → Markdown via its own dependency-free HTML parser; tests run it against a fixture site served by a local HTTP server — never the network). Every importer must emit redirects; silently changing URLs destroys SEO. The user-facing step-by-step guide is `tools/migrate/README.md` — keep it current when importer flags or behavior change (not to be confused with `migrations/`, the engine's own upgrade scripts).

## Errors are teaching moments

Every error message must name the file (and line where possible), say what is wrong, and say how to fix it — in plain language. Follow the existing `ContentError` pattern.

## Style

Boring, explicit code beats clever code. Match the existing voice: small pure functions, JSDoc where types help, comments only for constraints the code can't express. Future readers include AI agents and curious non-experts.
