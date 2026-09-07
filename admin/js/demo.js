// admin/js/demo.js — "Try the editor": the whole admin, with no account.
//
// Every call the admin makes to GitHub goes through one function (github.js
// `gh()`), so a working demo needs exactly one thing: a stand-in for the GitHub
// REST API. This module is that stand-in — an in-memory repository seeded from
// the site's own published JSON API (api/site.json + api/<collection>/index.json
// already carry every item's raw Markdown, §9), answering the same paths with
// the same shapes. Nothing is faked at the UI level: edits really rewrite files,
// saves really make commits, History really lists them and restores them. They
// just never leave this browser tab — state lives in sessionStorage, so a new
// tab starts clean and no demo visitor can touch anybody's repository.
//
// Enabled per site with "demo": true in the site block of site.config.json.

import { serializeFrontmatter } from '../lib/content.js';
import { DEMO_FLAG, DEMO_REPO, inDemo } from './github.js';

const SNAPSHOT = 'plain.demo.state';
const HOME = 'https://github.com/plain-cms/plain#quickstart-5-minutes';
const BUILD_MS = 8000;                        // how long the pretend deploy takes
const EXTRA_KEYS = ['template', 'example'];   // frontmatter keys that aren't collection fields
const MEDIA_PATH = /\/media\/[\w-]+(?:\/[\w-]+)*\.\w{2,5}/g;
const TEXT_FILE = /\.(md|json|txt|html|css|js|svg|xml|yml|yaml)$/i;

/** Repo path → {text} for files we hold, or {url} for bytes already on the published site. */
let files = new Map();
/** Oldest first. `changed` maps path → text after this commit (null = deleted), so History can restore. */
let commits = [];
let staged = new Map();   // blob id → base64, for the atomic multi-file commit path
let tree = [];            // the tree POSTed just before a multi-file commit
let counter = 0;

const nextSha = () => (++counter).toString(16).padStart(8, '0').padEnd(40, 'd');
const isText = (path) => TEXT_FILE.test(path);
const missing = (what) => Object.assign(new Error(`Not in this demo (${what}).`), { status: 404 });

function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

function fromBase64(base64) {
  const binary = atob(String(base64).replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

const sizeOf = (file) => {
  if (file.text !== undefined) return new TextEncoder().encode(file.text).length;
  return file.base64 ? Math.round(file.base64.length * 0.75) : file.bytes || 0;
};

// --- the virtual repository ---------------------------------------------------

/** The Markdown file behind an API item — the same bytes the editor would write. */
function itemToMarkdown(item, def) {
  const names = (def.fields || []).map((field) => field.name);
  const data = {};
  for (const key of [...names, ...EXTRA_KEYS]) if (item[key] !== undefined) data[key] = item[key];
  return serializeFrontmatter(data, `\n${(item.body || '').trim()}\n`, names);
}

/**
 * Build the repository from what the published site already serves: the config
 * and menu out of api/site.json, one Markdown file per item out of each
 * collection index, and a starting history so the first thing a visitor opens
 * looks like a site that has been running for a while.
 */
export async function seed(siteInfo) {
  files = new Map();
  commits = [];
  counter = 0;
  const config = { site: siteInfo.site, collections: siteInfo.collections, plugins: siteInfo.plugins || [], services: siteInfo.services || {} };
  files.set('site.config.json', { text: `${JSON.stringify(config, null, 2)}\n` });
  files.set('data/navigation.json', { text: `${JSON.stringify(siteInfo.navigation || [], null, 2)}\n` });
  files.set(`themes/${siteInfo.site.theme || 'default'}/theme.json`, { text: '{}\n' });

  const history = [];
  for (const [name, def] of Object.entries(siteInfo.collections || {})) {
    const { items } = await fetch(`../api/${name}/index.json`).then((r) => (r.ok ? r.json() : { items: [] })).catch(() => ({ items: [] }));
    for (const item of items) {
      if (!item.file) continue;
      const text = itemToMarkdown(item, def);
      files.set(item.file, { text });
      history.push({ date: `${item.date || '2026-01-01'}T09:00:00Z`, path: item.file, text, message: `${name.replace(/s$/, '')}: publish "${item.title || item.slug}"` });
    }
  }
  // Media the content actually references: those bytes are already served by
  // this site, so the library can list and preview them with no repo to read.
  for (const file of [...files.values()]) {
    for (const path of (file.text || '').match(MEDIA_PATH) || []) files.set(path.slice(1), { url: `..${path}` });
  }
  history.sort((a, b) => (a.date < b.date ? -1 : 1));
  commits = history.map((entry) => ({ sha: nextSha(), date: entry.date, message: entry.message, changed: { [entry.path]: entry.text } }));
  save();
}

function save() {
  // Media uploads are held as base64 and can outgrow the quota — when that
  // happens the demo simply keeps running from memory for the rest of the tab.
  try { sessionStorage.setItem(SNAPSHOT, JSON.stringify({ files: [...files], commits, counter })); } catch { /* over quota */ }
}

function restore() {
  try {
    const snapshot = JSON.parse(sessionStorage.getItem(SNAPSHOT) || 'null');
    if (!snapshot) return false;
    ({ commits, counter } = snapshot);
    files = new Map(snapshot.files);
    return true;
  } catch { return false; }
}

function record(message, changed) {
  const entry = { sha: nextSha(), date: new Date().toISOString(), message, changed };
  commits.push(entry);
  save();
  return entry.sha;
}

/** A file as it stood at a given commit — what History's Restore reads. */
function textAt(path, ref) {
  const index = commits.findIndex((commit) => commit.sha === ref);
  if (index < 0) return files.get(path)?.text;
  for (let i = index; i >= 0; i--) if (path in commits[i].changed) return commits[i].changed[path];
  return files.get(path)?.text;
}

function dirEntries(dir) {
  const prefix = `${dir.replace(/\/$/, '')}/`;
  const entries = new Map();
  for (const [path, file] of files) {
    if (!path.startsWith(prefix)) continue;
    const rest = path.slice(prefix.length);
    const slash = rest.indexOf('/');
    const name = slash < 0 ? rest : rest.slice(0, slash);
    if (!entries.has(name)) entries.set(name, { name, path: prefix + name, type: slash < 0 ? 'file' : 'dir', sha: 'demo', size: sizeOf(file) });
  }
  return [...entries.values()];
}

async function blobOf(file) {
  if (file.url) return fetch(file.url).then((r) => r.blob());
  if (file.base64) return new Blob([Uint8Array.from(atob(file.base64), (c) => c.charCodeAt(0))]);
  return new Blob([file.text || '']);
}

// --- the GitHub API stand-in --------------------------------------------------

/**
 * Answer one GitHub REST call from the virtual repository: same paths, same
 * response shapes, same 404s, so every admin screen works unchanged.
 */
export async function request(fullPath, { method = 'GET', body, raw = false } = {}) {
  const [route, search = ''] = fullPath.replace(/^\/repos\/[^/]+\/[^/]+\/?/, '').split('?');
  const query = new URLSearchParams(search);

  if (route === '') return { full_name: DEMO_REPO, default_branch: 'main' };

  if (route.startsWith('contents/')) {
    const path = decodeURIComponent(route.slice('contents/'.length));
    if (method === 'PUT') {
      const file = isText(path) ? { text: fromBase64(body.content) } : { base64: body.content };
      files.set(path, file);
      return { content: { sha: 'demo' }, commit: { sha: record(body.message, { [path]: file.text ?? null }) } };
    }
    if (method === 'DELETE') {
      files.delete(path);
      return { commit: { sha: record(body.message, { [path]: null }) } };
    }
    const file = files.get(path);
    if (file) {
      if (raw) return blobOf(file);
      const ref = query.get('ref');
      const text = ref && ref !== 'main' ? textAt(path, ref) : file.text;
      return { path, name: path.split('/').pop(), type: 'file', sha: 'demo', size: sizeOf(file), content: file.base64 ?? toBase64(text ?? '') };
    }
    const entries = dirEntries(path);
    if (entries.length) return entries;
    throw missing(path);
  }

  // The atomic multi-file commit (github.js `commitFiles`): blobs, then a tree,
  // then a commit, then the branch ref — replayed here in the same four steps.
  if (route === 'git/blobs' && method === 'POST') { const sha = nextSha(); staged.set(sha, body.content); return { sha }; }
  if (route === 'git/trees' && method === 'POST') { tree = body.tree || []; return { sha: nextSha() }; }
  if (route === 'git/commits' && method === 'POST') {
    const changed = {};
    for (const entry of tree) {
      if (entry.sha === null) { files.delete(entry.path); changed[entry.path] = null; continue; }
      if (!staged.has(entry.sha)) continue;                       // a blob we never staged — leave the file alone
      const file = isText(entry.path) ? { text: fromBase64(staged.get(entry.sha)) } : { base64: staged.get(entry.sha) };
      files.set(entry.path, file);
      changed[entry.path] = file.text ?? null;
    }
    staged = new Map();
    tree = [];
    return { sha: record(body.message, changed) };
  }
  if (route.startsWith('git/ref/heads/')) return { object: { sha: commits.at(-1)?.sha || nextSha() } };
  if (route.startsWith('git/commits/')) return { tree: { sha: 'demo' } };
  if (route.startsWith('git/refs/heads/')) return null;

  if (route.startsWith('git/trees/')) {
    // Media we only reference (its bytes are on the published site) has no size
    // until we ask for one — the library shows it, so fetch the headers once.
    await Promise.all([...files.values()].filter((file) => file.url && file.bytes === undefined).map(async (file) => {
      file.bytes = Number(await fetch(file.url, { method: 'HEAD' }).then((r) => r.headers.get('content-length')).catch(() => 0)) || 0;
    }));
    return { tree: [...files].map(([path, file]) => ({ path, type: 'blob', sha: 'demo', size: sizeOf(file) })) };
  }

  if (route === 'commits') {
    const path = query.get('path');
    return [...commits].reverse().filter((commit) => !path || path in commit.changed).slice(0, Number(query.get('per_page') || 30))
      .map((commit) => ({ sha: commit.sha, commit: { message: commit.message, committer: { date: commit.date }, author: { name: 'You' } }, author: { login: 'you' } }));
  }

  // The publish pill polls this: report a build that finishes a few seconds in.
  if (route.includes('/runs')) {
    const entry = commits.find((commit) => commit.sha === query.get('head_sha'));
    const done = entry ? Date.now() - new Date(entry.date).getTime() > BUILD_MS : true;
    return { workflow_runs: [{ status: done ? 'completed' : 'in_progress', conclusion: done ? 'success' : null, html_url: HOME }] };
  }
  if (route.endsWith('/dispatches')) return null;
  if (route.startsWith('pulls')) return [];

  throw missing(route);
}

// --- mode + banner ------------------------------------------------------------

export const demo = {
  get active() { return inDemo(); },
  /** Enter the demo from the sign-in screen (or a ?demo=1 link). */
  async enter(siteInfo) { sessionStorage.setItem(DEMO_FLAG, '1'); await seed(siteInfo); },
  /** Re-entering after a reload: keep this tab's edits, or seed if there are none. */
  async resume(siteInfo) { if (!restore()) await seed(siteInfo); },
  async reset(siteInfo) { sessionStorage.removeItem(SNAPSHOT); await seed(siteInfo); },
  exit() {
    try { sessionStorage.removeItem(DEMO_FLAG); sessionStorage.removeItem(SNAPSHOT); } catch { /* private mode */ }
    if (typeof document === 'undefined') return;
    document.getElementById('demo-bar')?.remove();
    document.body.classList.remove('demo-mode');
  },
  request,
};

/** The standing "this is a demo" strip. Plain DOM: ui.js is downstream of this module. */
export function mountBanner({ onReset, onExit }) {
  if (document.getElementById('demo-bar')) return;
  const bar = document.createElement('div');
  bar.id = 'demo-bar';
  const note = document.createElement('span');
  note.innerHTML = '<strong>Demo.</strong> Editing, publishing and history all work — your changes stay in this browser tab.';
  const button = (label, onclick) => Object.assign(document.createElement('button'), { textContent: label, onclick });
  const link = Object.assign(document.createElement('a'), { href: HOME, target: '_blank', rel: 'noopener', textContent: 'Run this on your own site →' });
  bar.append(note, button('Start over', onReset), button('Exit demo', onExit), link);
  document.body.append(bar);
  document.body.classList.add('demo-mode');
}
