#!/usr/bin/env node
// scripts/import-hn.js — import a Hacker News "Ask HN: Who is hiring?" thread
// into content/jobs/ (one Markdown file per top-level comment).
//
//   node scripts/import-hn.js [month] [year] [--dry-run] [--thread=<id>]
//
// Site-owned, not engine code: it lives outside tools/ so `engine-manifest.js`
// never sweeps it into engine.json and `update.js` never touches it (§14.1).
//
// Defaults to the current month. The thread is found through the HN Algolia
// search API (author whoishiring), then read in one request as a full item
// tree. Dead, deleted and empty comments are skipped by the API.
//
// The import is INCREMENTAL and IDEMPOTENT: a comment whose HN id already has
// a file in content/jobs/ is left completely alone — never rewritten, never
// renamed. That matters because a job's filename is its live URL, and posters
// edit their comments all month. So the tool is safe (and meant) to be re-run:
// the HN thread keeps filling up for weeks after it opens, and an import run
// on day 1 captures only a fraction of the month's jobs.
//
//   --dry-run       report what would be written, write nothing
//   --thread=<id>   skip the search, use this HN story id
//
// Dependency-free on purpose: node:fs, node:path and global fetch only.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const JOBS = path.join(ROOT, 'content', 'jobs');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

/** Frontmatter description and headline segments are clipped to these lengths. */
const DESC_LIMIT = 155;
const SEGMENT_LIMIT = 80;
/** Slugs are clipped to this many characters after the `<month>-<year>-` prefix. */
const SLUG_LIMIT = 96;
/** Shorter than this is not a job post — a bare email, a one-line reply. */
const MIN_POST_LENGTH = 100;

// ---------------------------------------------------------------- text helpers

/** HN serves comments as HTML with a small fixed set of entities. */
function unescape(s) {
  return s
    .replace(/&#x2F;/g, '/').replace(/&#x27;/g, "'").replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
}

/** Plain text for titles and descriptions: links and tags become a space. */
function flatten(html) {
  const noLinks = html.replace(/<a\b[^>]*>[\s\S]*?<\/a>/g, ' ');
  return unescape(noLinks.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/** Clip to `limit` characters on a word boundary. Returns [text, wasClipped]. */
function clip(text, limit) {
  if (text.length <= limit) return [text, false];
  const cut = text.slice(0, limit);
  return [cut.slice(0, cut.lastIndexOf(' ')), true];
}

/**
 * Slug piece: spaces, parentheses and currency signs vanish so "Remote (US)"
 * reads as "remoteus", while every other punctuation mark becomes a hyphen so
 * "Brooklyn, NY" stays two words.
 */
function slugify(s) {
  return unescape(s.replace(/<[^>]+>/g, ''))
    .toLowerCase()
    .replace(/[\s()$]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * HN headlines are "Company | Role | Location | link" (or the same with " - "
 * between fields). Segments holding the apply link carry no information for a
 * title, so they are dropped.
 */
function segments(headline) {
  const parts = headline.includes('|')
    ? headline.split('|')
    : headline.split(/\s+-\s+/);
  return parts
    .filter((p) => !p.includes('<a'))
    .map((p) => clip(flatten(p), SEGMENT_LIMIT)[0])
    .filter(Boolean);
}

// ------------------------------------------------------------------ the import

/** Build one job file from one top-level comment. */
function toJob(comment, section, date) {
  const segs = segments(comment.text.split('<p>')[0]);
  const title = segs.length ? segs.slice(0, 2).join(' : ') : comment.author;
  const tail = segs.length
    ? [comment.author, ...segs].map(slugify).join('-')
    : slugify(comment.author);
  const slug = `${section}-${tail}`
    .slice(0, section.length + 1 + SLUG_LIMIT)
    .replace(/-+$/, '');

  // A pipe is a field separator on HN, not punctuation — read it as a dash.
  const text = comment.text.replace(/\|/g, '-').replace(/<i>([\s\S]*?)<\/i>/g, '*$1*');
  const [desc, clipped] = clip(flatten(text), DESC_LIMIT);
  const body = text.split('<p>').map((p) => p.trim()).join('\n\n');

  const frontmatter = [
    '---',
    `title: "${title}"`,
    `date: ${date}`,
    `description: ${desc}${clipped ? '…' : ''}`,
    `author: ${comment.author}`,
    `authorUrl: https://news.ycombinator.com/item?id=${comment.id}`,
    `byline: ${comment.author}`,
    `section: ${section}`,
    'tags:',
    `  - ${section}`,
    '---',
    '',
  ].join('\n');

  return { slug, content: `${frontmatter}${body}\n[[form:apply]]\n` };
}

/** HN ids already on disk, so a re-run only ever adds. */
function importedIds() {
  const ids = new Map();
  for (const file of fs.readdirSync(JOBS)) {
    if (!file.endsWith('.md')) continue;
    const head = fs.readFileSync(path.join(JOBS, file), 'utf8').slice(0, 1024);
    const id = head.match(/^authorUrl: .*item\?id=(\d+)$/m);
    if (id) ids.set(id[1], file);
  }
  return ids;
}

async function findThread(month, year) {
  const query = encodeURIComponent(`Ask HN: Who is hiring? (${month} ${year})`);
  const url = `https://hn.algolia.com/api/v1/search?query=${query}&tags=story,author_whoishiring`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HN search failed: ${res.status} ${res.statusText}`);
  const { hits } = await res.json();
  const hit = hits.find((h) => h.title === `Ask HN: Who is hiring? (${month} ${year})`);
  if (!hit) {
    throw new Error(
      `No "Ask HN: Who is hiring? (${month} ${year})" thread found.\n` +
      `  Fix: the thread opens on the first weekday of the month — check the\n` +
      `  month and year, or pass --thread=<id> with the story id from its URL.`,
    );
  }
  return hit.objectID;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const threadFlag = args.find((a) => a.startsWith('--thread='));
  const rest = args.filter((a) => !a.startsWith('--'));

  const now = new Date();
  const month = rest[0]
    ? MONTHS.find((m) => m.toLowerCase() === rest[0].toLowerCase())
    : MONTHS[now.getMonth()];
  const year = rest[1] || String(now.getFullYear());
  if (!month) {
    console.error(`Unknown month "${rest[0]}". Use a name like "August".`);
    process.exit(1);
  }

  const section = `${month.toLowerCase()}-${year}`;
  const date = `${year}-${String(MONTHS.indexOf(month) + 1).padStart(2, '0')}-01`;

  const thread = threadFlag ? threadFlag.split('=')[1] : await findThread(month, year);
  const res = await fetch(`https://hn.algolia.com/api/v1/items/${thread}`);
  if (!res.ok) throw new Error(`HN item ${thread} failed: ${res.status} ${res.statusText}`);
  const story = await res.json();

  // Algolia keeps moderated comments in the tree with a placeholder body, and
  // the odd top-level reply is a bare email address rather than a job post.
  const PLACEHOLDER = /^\[(flagged|dead|deleted)\]$/i;
  const comments = (story.children || []).filter((c) =>
    c.text && c.author
    && !PLACEHOLDER.test(c.text.trim())
    && flatten(c.text).length >= MIN_POST_LENGTH);
  console.log(`${story.title} (id ${thread})`);
  console.log(`  ${comments.length} live top-level posts`);

  const existing = importedIds();
  const onDisk = new Set(fs.readdirSync(JOBS));
  let added = 0;
  let skipped = 0;

  for (const comment of comments) {
    if (existing.has(String(comment.id))) { skipped += 1; continue; }

    const job = toJob(comment, section, date);
    // Never take a filename that is already a live URL.
    let name = `${job.slug}.md`;
    for (let n = 1; onDisk.has(name); n += 1) name = `${job.slug}-${n}.md`;
    onDisk.add(name);

    if (!dryRun) fs.writeFileSync(path.join(JOBS, name), job.content);
    added += 1;
  }

  console.log(`  ${skipped} already imported, ${added} new${dryRun ? ' (dry run — nothing written)' : ''}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
