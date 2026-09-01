<p align="center">
  <img src="media/public/logo.svg" alt="AngJobs" width="340">
</p>

<p align="center">
  <a href="https://github.com/victorantos/AngJobs/actions/workflows/deploy-vps.yml"><img src="https://github.com/victorantos/AngJobs/actions/workflows/deploy-vps.yml/badge.svg" alt="Deploy to VPS"></a>
  <a href="https://angjobs.com"><img src="https://img.shields.io/website?url=https%3A%2F%2Fangjobs.com&label=angjobs.com&up_color=brightgreen" alt="Site status"></a>
  <a href="https://github.com/victorantos/AngJobs/releases"><img src="https://img.shields.io/github/v/release/victorantos/AngJobs?sort=semver" alt="Latest release"></a>
  <a href="https://plain-cms.com"><img src="https://img.shields.io/badge/built%20with-plain-FF6600.svg" alt="Built with plain"></a>
  <a href="package.json"><img src="https://img.shields.io/badge/dependencies-1-brightgreen.svg" alt="One dependency"></a>
  <a href="https://angjobs.com/jobs/"><img src="https://img.shields.io/badge/live%20jobs-750%2B-orange.svg" alt="750+ live jobs"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT license"></a>
  <a href="https://github.com/victorantos/AngJobs/stargazers"><img src="https://img.shields.io/github/stars/victorantos/AngJobs?style=flat&color=FF6600&label=stars%20towards%20100" alt="Stars"></a>
</p>

**Jobs for hackers.** Every listing from Hacker News' monthly *"Ask HN: Who is hiring?"* thread, turned into a fast, searchable job board — one page per job, three months live at a time.

Running since **December 2014** — now in its twelfth year, and on its third engine: Angular, then VuePress, now [plain](https://plain-cms.com).

**[angjobs.com](https://angjobs.com)** · **[Browse jobs](https://angjobs.com/jobs/)** · **[RSS](https://angjobs.com/jobs/rss.xml)** · **[Post a job](https://angjobs.com/post-a-job/)** · **[About](https://angjobs.com/about/)**

## Built on plain CMS

AngJobs runs on **[plain](https://plain-cms.com)**, a Git-native CMS: **this repo is the whole website**. Every job is a Markdown file in `content/jobs/`, every setting is JSON, and `node build.js` turns the lot into a static site. There is no database and no CMS server to patch — one runtime dependency (`marked`), and the published pages work with JavaScript switched off.

It is a static site *with a backend*, though — two small services do the things a folder of files can't:

| Service | What it does |
| ------- | ------------ |
| **`api.victorantos.com`** | Receives job applications. Every job page carries an Apply form (the `api-form` plugin, wired through `services.backend` in `site.config.json`) that POSTs the applicant's name, email, and message, and emails it to the poster. It degrades to a plain HTML form without JavaScript. |
| **`plain-oauth-angjobs.…workers.dev`** | A Cloudflare Worker handling *Sign in with GitHub* for the admin. Anyone with write access to this repo can open **[/admin/](https://angjobs.com/admin/)**, sign in, and write a job with live preview — each save is a commit, no access token to paste. |

Everything else is generated at build time: the job pages, the month archives, a client-side search index, `sitemap.xml`, `robots.txt`, per-collection RSS, an `llms.txt` summary for agents, and a read-only JSON API under [`/api/`](https://angjobs.com/api/site.json).

## Post a job — open a pull request

Listings are files, so **submitting a job is a pull request**. No account beyond GitHub, no form to babysit.

1. **[Open the job template on GitHub →](https://angjobs.com/post-a-job/)** — the button on that page opens GitHub's editor with the frontmatter pre-filled.
2. **Name the file** `<month>-<year>-<company>-<role>.md`, lowercase with hyphens — e.g. `september-2026-acme-senior-backend-engineer.md`. **The filename is the URL**: that becomes `angjobs.com/jobs/september-2026-acme-senior-backend-engineer/`.
3. **Fill in the frontmatter and body:**

   ```markdown
   ---
   title: "Acme : Senior Backend Engineer : Remote (EU)"
   date: 2026-09-01
   description: One line about the role, used for search results and link previews.
   author: your-hn-username
   section: september-2026
   tags:
     - september-2026
   ---
   Acme | Senior Backend Engineer | Remote (EU) | €90k–€120k

   Describe the role, the stack, and how to apply.

   [[form:apply]]
   ```

   `[[form:apply]]` is what renders the Apply form on the page — keep it as the last line.
4. **Choose "Propose changes"** to open the PR. Keep the frontmatter keys above — the build validates them, so a malformed listing fails the build with a clear message instead of half-deploying.
5. **Review** — I read every PR. Once approved you get a payment link by email; after payment I merge it and the job is live within minutes.

**Nothing merges itself.** Opening a pull request never publishes a job. Every PR needs an explicit approving review from the repo owner ([@victorantos](https://github.com/victorantos)) before it can reach `main` — enforced by [`.github/CODEOWNERS`](.github/CODEOWNERS), with auto-merge disabled repo-wide. A PR from a fork also runs no workflows and touches no secrets. Treat an open PR as a submission, not a publication.

Spotted a typo or a dead listing? Same flow — edit the file, open a PR.

## Where the jobs come from

The monthly bulk comes from HN's *"Who is hiring?"* thread, pulled in by a scheduled importer that writes one Markdown file per top-level post — title, date, HN username, and a link back to the original comment.

**Only the last three months of Hacker News jobs are kept.** That is the whole archive policy: as a new month is imported the oldest one rotates out, so the board holds roughly 750 listings and never grows into a graveyard of expired roles. Right now that is **June, July and August 2026**.

Rotating out is not deleting a URL, though. When a month drops off, its job URLs are retargeted in `data/redirects.json` rather than left to rot, so nothing that was ever indexed starts returning a 404.

That file is the reason the VuePress → plain move cost no search traffic: it carries **1,123 redirects**, every legacy `.html` URL flattened to a single hop.

## Repo layout

```
content/jobs/     one Markdown file per job — filename is the URL
content/pages/    home, about, post-a-job
data/             navigation.json, redirects.json, promos.json, footer.json
themes/angjobs/   the theme (plain's "gazette" starter, forked into a job board)
plugins/          search, api-form (the Apply form), goatcounter
site.config.json  collections, fields, plugin options, services
build.js + lib/   the plain engine — content in, dist/ out
```

## Run it locally

```bash
npm install
npm run dev     # → http://localhost:4000, admin at /admin/
```

| Command | What it does |
| ------- | ------------ |
| `npm run build` | Build the site into `dist/` |
| `npm run dev` | Build, serve on :4000, rebuild on change |
| `npm test` | Run the test suite |

Both `npm test` and `npm run build` must pass before anything is committed — see [CLAUDE.md](CLAUDE.md), which is also what lets Claude Code and other agents edit this repo safely.

## Deploying

Push to `main` and [`.github/workflows/deploy-vps.yml`](.github/workflows/deploy-vps.yml) builds the site and ships `dist/` to a VPS behind Cloudflare. The badge at the top of this file is that workflow.

## Star this repo ⭐

AngJobs has been free and open source for its whole twelve years — no tracking beyond a page counter, no paywall on any listing, and the entire board sitting right here as Markdown you can read, fork, or scrape.

The goal for this year is **100 GitHub stars**. If the board has ever pointed you at a job, or you just like the idea of a job site that is a Git repo, [**give it a star**](https://github.com/victorantos/AngJobs) — it is the whole marketing budget.

## License

[MIT](LICENSE). The job listings themselves are posts from Hacker News, reproduced with attribution and a link back to the original comment.
