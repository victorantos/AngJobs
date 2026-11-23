// Theme rules (cms-spec.md §10.1, themes/CATALOGUE.md, families/): every theme
// that names a family whose contract is in families/ must build its sample site
// with no warnings, match the family contract exactly, describe every token,
// stay inside the size budget, keep its interface words in strings.json in
// eight languages, load nothing external, and hold WCAG AA on its colour tokens
// in both schemes.
//
// A site without a families/ folder (most sites: it is not engine-owned) skips
// this file — a site's own themes are its owner's business.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../build.js';
import { DEFAULT_STRINGS } from '../lib/i18n.js';

const repo = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const themesDir = path.join(repo, 'themes');
const familiesDir = path.join(repo, 'families');

const LANGS = ['de', 'fr', 'it', 'ro', 'es', 'pt', 'nl'];
const UNIVERSAL_TEMPLATES = ['base', 'page', 'post', 'list', '404'];
const TOKEN_VALUE = /^[A-Za-z0-9 #%.,()'"_+-]+$/; // plain CSS: no url(), slash or colon
const IMAGE_FILE = /\.(jpe?g|png|webp|gif|svg|avif)$/i;
const MAX_BYTES = 45 * 1024;
const MAX_ENHANCE_BYTES = 3 * 1024;

const readJson = (file, fallback) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : fallback);
const walk = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true, recursive: true }).filter((e) => e.isFile()).map((e) => path.join(e.parentPath, e.name)) : []);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** The machine-readable block of families/<family>.md: the first ```json fence with a "family" key. */
function readContract(family) {
  const file = path.join(familiesDir, `${family}.md`);
  if (!fs.existsSync(file)) return null;
  for (const m of fs.readFileSync(file, 'utf8').matchAll(/```json\n([\s\S]*?)\n```/g)) {
    try { const data = JSON.parse(m[1]); if (data.family) return data; } catch { /* another fence */ }
  }
  return null;
}

const themes = fs.existsSync(familiesDir)
  ? fs.readdirSync(themesDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(themesDir, e.name, 'theme.json')))
    .map((e) => ({ name: e.name, dir: path.join(themesDir, e.name), meta: readJson(path.join(themesDir, e.name, 'theme.json')), starter: readJson(path.join(themesDir, e.name, 'starter.json'), {}) }))
    .filter((t) => t.meta.family && readContract(t.meta.family))
  : [];

// ---------- one scratch site, reused for every build ----------

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'plain-themes-'));
const repoConfig = readJson(path.join(repo, 'site.config.json'));
for (const dir of ['admin', 'lib', 'plugins']) fs.cpSync(path.join(repo, dir), path.join(scratch, dir), { recursive: true });
fs.copyFileSync(path.join(repo, 'config.defaults.json'), path.join(scratch, 'config.defaults.json'));
fs.writeFileSync(path.join(scratch, 'package.json'), '{ "type": "module", "private": true }\n'); // plugins are ES modules
fs.symlinkSync(themesDir, path.join(scratch, 'themes'));
test.after(() => fs.rmSync(scratch, { recursive: true, force: true }));

/** Lay out `theme` over the sample content of `contentTheme` (itself, or a sibling of its family) and build. */
async function buildSample(theme, contentTheme, { stripImages = false } = {}) {
  for (const dir of ['content', 'data', 'media', 'dist']) fs.rmSync(path.join(scratch, dir), { recursive: true, force: true });
  const sample = contentTheme.starter.sampleContent ? path.join(contentTheme.dir, contentTheme.starter.sampleContent) : null;
  if (!sample || !fs.existsSync(sample)) return null; // the default theme: the repo's own content is its sample
  fs.cpSync(sample, scratch, { recursive: true });
  const nav = theme.starter.navigation || [];
  const wantsPosts = nav.some((entry) => entry.url === '/blog/') || fs.existsSync(path.join(sample, 'content', 'posts'));
  const collections = { pages: repoConfig.collections.pages, ...(wantsPosts ? { posts: repoConfig.collections.posts } : {}), ...structuredClone(theme.starter.collections || {}) };
  for (const def of Object.values(collections)) fs.mkdirSync(path.join(scratch, def.path), { recursive: true });
  fs.mkdirSync(path.join(scratch, 'data'), { recursive: true });
  if (nav.length) fs.writeFileSync(path.join(scratch, 'data', 'navigation.json'), JSON.stringify(nav));
  if (stripImages) removeImages(collections);
  const site = { title: contentTheme.starter.sampleTitle || theme.meta.title, url: 'https://example.com', description: 'Sample site.', language: 'en', theme: theme.name };
  fs.writeFileSync(path.join(scratch, 'site.config.json'), JSON.stringify({ site, collections }));
  return build({ root: scratch, outDir: path.join(scratch, 'dist'), quiet: true });
}

/** The zero-image site: no image fields, no Markdown images, no image paths in data files, no media/. */
function removeImages(collections) {
  fs.rmSync(path.join(scratch, 'media'), { recursive: true, force: true });
  for (const def of Object.values(collections)) {
    const imageFields = new Set((def.fields || []).filter((f) => f.type === 'image').map((f) => f.name));
    for (const file of walk(path.join(scratch, def.path)).filter((f) => f.endsWith('.md'))) {
      const out = []; let fences = 0; let skipping = false;
      for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
        if (line.trim() === '---' && fences < 2) { fences++; skipping = false; out.push(line); continue; }
        if (fences !== 1) { out.push(line.replace(/!\[[^\]]*\]\([^)]*\)/g, '')); continue; }
        const key = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
        if (key) {
          skipping = imageFields.has(key[1]) || IMAGE_FILE.test(key[2].replace(/^["']|["']$/g, '')) || (key[2] === '' && /^(photos|gallery|images)$/i.test(key[1]));
          if (skipping) continue;
        } else if (skipping && /^\s+-\s/.test(line)) continue;
        out.push(line);
      }
      fs.writeFileSync(file, out.join('\n'));
    }
  }
  const blank = (v) => (typeof v === 'string' ? (IMAGE_FILE.test(v) ? '' : v) : Array.isArray(v) ? v.map(blank).filter((x) => x !== '') : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blank(x)])) : v);
  for (const file of walk(path.join(scratch, 'data')).filter((f) => f.endsWith('.json'))) fs.writeFileSync(file, JSON.stringify(blank(readJson(file))));
}

/** What a built site must never contain: anything loaded from elsewhere, inline script, an empty image box. */
function outputProblems(label) {
  const problems = [];
  const dist = path.join(scratch, 'dist');
  for (const file of walk(dist).filter((f) => f.endsWith('.html') && !f.startsWith(path.join(dist, 'admin') + path.sep))) {
    const html = fs.readFileSync(file, 'utf8');
    const rel = path.relative(dist, file);
    for (const m of html.matchAll(/<(?:script|img|iframe|video|audio|source|embed|object|link|form)\b[^>]*?\b(?:src|href|action|poster|data)="((?:https?:)?\/\/[^"]+)"/g)) {
      if (!m[1].startsWith('https://example.com')) problems.push(`${label}: ${rel} loads or posts to an external URL ${m[1]}`);
    }
    for (const m of html.matchAll(/<script\b([^>]*)>/g)) {
      if (!/\bsrc=/.test(m[1]) && !/type="application\/(ld\+)?json"/.test(m[1])) problems.push(`${label}: ${rel} has an inline <script>`);
    }
    if (/<img\b[^>]*\bsrc=""/.test(html)) problems.push(`${label}: ${rel} has an <img> with an empty src`);
  }
  return problems;
}

// ---------- static rules ----------

/** Custom properties of one `:root { … }` block body. */
const declarations = (body) => Object.fromEntries([...body.matchAll(/(--[A-Za-z0-9-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim().replace(/\s+/g, ' ')]));

function tokenProblems(theme, css) {
  const problems = [];
  const plain = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const blocks = [...plain.matchAll(/:root\s*\{([^}]*)\}/g)].map((m) => declarations(m[1]));
  const base = blocks[0] || {};
  const described = theme.meta.tokens || {};
  for (const name of Object.keys(base)) if (!(name in described)) problems.push(`token ${name} is in theme.css but not described in theme.json`);
  for (const name of Object.keys(described)) if (!(name in base)) problems.push(`token ${name} is described in theme.json but missing from the first :root block of theme.css`);
  for (const block of blocks) for (const [name, value] of Object.entries(block)) {
    if (!(name in base)) problems.push(`${name} is set in a later :root block but not declared in the first`);
    if (!TOKEN_VALUE.test(value)) problems.push(`token ${name}: "${value}" is not a plain CSS value (no url(), slash or colon — write rgba(0,0,0,0.1), not rgb(0 0 0 / 0.1))`);
  }
  return problems;
}

/** sRGB colour → [r, g, b] in 0–255, or null for anything this test cannot read (keywords, color-mix). */
function parseColour(value) {
  const hex = value.match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    const h = hex[1].length <= 4 ? [...hex[1]].map((c) => c + c).join('') : hex[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  const rgb = value.match(/^rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/i);
  return rgb ? rgb.slice(1, 4).map(Number) : null;
}

function contrast(a, b) {
  const luminance = (rgb) => rgb.map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** Text and accent tokens against the page background, in the default scheme and the other one. */
function contrastProblems(css) {
  const problems = [];
  const plain = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const base = declarations((plain.match(/:root\s*\{([^}]*)\}/) || [])[1] || '');
  const other = plain.match(/@media\s*\(\s*prefers-color-scheme:\s*(dark|light)\s*\)\s*\{\s*:root\s*\{([^}]*)\}/);
  const schemes = [['default scheme', base], ...(other ? [[`${other[1]} scheme`, { ...base, ...declarations(other[2]) }]] : [])];
  for (const [label, tokens] of schemes) {
    const colour = (name) => { let v = tokens[name]; for (let i = 0; v && i < 4; i++) { const ref = v.match(/^var\((--[A-Za-z0-9-]+)\)$/); if (!ref) break; v = tokens[ref[1]]; } return v ? parseColour(v) : null; };
    const bg = colour('--color-bg');
    if (!bg) { problems.push(`${label}: --color-bg is missing or not a hex/rgb colour, so contrast cannot be checked`); continue; }
    for (const [name, needed] of [['--color-text', 4.5], ['--color-ink', 4.5], ['--color-muted', 4.5], ['--color-accent', 3]]) {
      const fg = colour(name);
      if (!fg) continue;
      const ratio = contrast(fg, bg);
      if (ratio < needed) problems.push(`${label}: ${name} on --color-bg is ${ratio.toFixed(2)}:1 (WCAG AA needs ${needed}:1)`);
    }
  }
  return problems;
}

/** Interface words in templates, inline script/style/handlers, and strings.json in eight languages. */
function templateProblems(theme) {
  const problems = [];
  const strings = readJson(path.join(theme.dir, 'strings.json'), {});
  const used = new Set();
  const blankOut = (s) => s.replace(/[^\n]/g, ' ');
  for (const file of walk(path.join(theme.dir, 'templates')).filter((f) => f.endsWith('.html'))) {
    const rel = path.relative(theme.dir, file);
    const source = fs.readFileSync(file, 'utf8');
    for (const m of source.matchAll(/strings\.([A-Za-z0-9_]+)/g)) used.add(m[1]);
    let text = source.replace(/<!--[\s\S]*?-->/g, blankOut).replace(/<(script|style)\b[\s\S]*?<\/\1>/g, blankOut).replace(/\{\{\{?[\s\S]*?\}?\}\}/g, blankOut);
    for (const m of text.matchAll(/\b(aria-label|title|alt|placeholder|value)="([^"]*[A-Za-z]{2,}[^"]*)"/g)) {
      problems.push(`${rel}:${text.slice(0, m.index).split('\n').length} hard-coded ${m[1]}="${m[2].trim()}" — use {{ strings.* }}`);
    }
    text = text.replace(/<[^>]*>/g, blankOut).replace(/&[a-z]+;|&#\d+;/gi, ' ');
    text.split('\n').forEach((line, i) => { if (/[A-Za-z]{2,}/.test(line)) problems.push(`${rel}:${i + 1} hard-coded interface words "${line.trim().slice(0, 60)}" — use {{ strings.* }}`); });
    source.split('\n').forEach((line, i) => {
      if (/<script\b(?![^>]*\bsrc=)/.test(line)) problems.push(`${rel}:${i + 1} inline <script>`);
      if (/\son[a-z]+\s*=\s*["']/.test(line)) problems.push(`${rel}:${i + 1} inline event handler`);
      if (/<style\b|\sstyle\s*=\s*["']/.test(line)) problems.push(`${rel}:${i + 1} inline style — use a class`);
      if (/(?:href|src|action)="(?:https?:)?\/\//.test(line)) problems.push(`${rel}:${i + 1} hard-coded external URL`);
    });
  }
  for (const [key, value] of Object.entries(strings)) {
    if (LANGS.includes(key) ? !value || typeof value !== 'object' : typeof value !== 'string') problems.push(`strings.json "${key}": English keys are flat strings; only ${LANGS.join(', ')} hold objects`);
  }
  for (const key of used) if (!(key in DEFAULT_STRINGS) && typeof strings[key] !== 'string') problems.push(`{{ strings.${key} }} is used but not defined in strings.json or the engine defaults`);
  for (const lang of LANGS) {
    const missing = [...used].filter((key) => typeof strings[lang]?.[key] !== 'string' || !strings[lang][key].trim());
    if (missing.length) problems.push(`strings.json "${lang}" is missing: ${missing.join(', ')}`);
  }
  return problems;
}

/** Shape of a JSON value: keys and value types, lists by their first item. */
const shapeOf = (v) => (Array.isArray(v) ? (v.length ? [shapeOf(v[0])] : []) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, shapeOf(v[k])])) : typeof v);
const sameShape = (a, b) => (Array.isArray(a) && Array.isArray(b) ? !a.length || !b.length || sameShape(a[0], b[0]) : a && b && typeof a === 'object' && typeof b === 'object' ? same(Object.keys(a), Object.keys(b)) && Object.keys(a).every((k) => sameShape(a[k], b[k])) : a === b);

function contractProblems(theme, contract, css) {
  const problems = [];
  const family = theme.meta.family;
  if (!same(contract.collections || {}, theme.starter.collections || {})) problems.push(`starter.json "collections" differs from families/${family}.md — it must be identical, key for key`);
  if (!same(contract.navigation || [], theme.starter.navigation || [])) problems.push(`starter.json "navigation" differs from families/${family}.md`);
  // "extras" names what a theme shipped before its family existed and keeps on top of the contract.
  const extra = (contract.extras || {})[theme.name] || {};
  if (!same(extra.plugins || contract.plugins || [], theme.starter.plugins || [])) problems.push(`starter.json "plugins" differs from families/${family}.md`);
  if (!same(extra.layouts || contract.layouts || [], theme.meta.layouts || [])) problems.push(`theme.json "layouts" differs from families/${family}.md`);
  for (const name of [...UNIVERSAL_TEMPLATES, ...(contract.templates || [])]) if (!fs.existsSync(path.join(theme.dir, 'templates', `${name}.html`))) problems.push(`templates/${name}.html is missing`);
  for (const name of [...(contract.contentTemplates || []), ...(extra.contentTemplates || [])]) if (!fs.existsSync(path.join(theme.dir, 'content-templates', name))) problems.push(`content-templates/${name} is missing`);
  for (const c of contract.contentClasses || []) if (!new RegExp(`\\.${c.class}(?![\\w-])`).test(css)) problems.push(`theme.css has no rule for the content class .${c.class}`);
  const sampleData = theme.starter.sampleContent ? path.join(theme.dir, theme.starter.sampleContent, 'data') : null;
  if (sampleData && fs.existsSync(path.dirname(sampleData))) {
    for (const [file, blank] of Object.entries(contract.data || {})) {
      if (!fs.existsSync(path.join(sampleData, file))) problems.push(`sample/data/${file} is missing`);
      else if (!sameShape(shapeOf(blank), shapeOf(readJson(path.join(sampleData, file))))) problems.push(`sample/data/${file} does not have the shape families/${family}.md declares`);
    }
    for (const file of fs.existsSync(sampleData) ? fs.readdirSync(sampleData) : []) {
      if (file.endsWith('.json') && !/^navigation(\.[a-z]+)?\.json$/.test(file) && !(file in (contract.data || {}))) problems.push(`sample/data/${file} is not a data file of the ${family} contract`);
    }
  }
  return problems;
}

function manifestProblems(theme, css) {
  const problems = [];
  const { meta, dir, starter } = theme;
  if (meta.name !== theme.name) problems.push(`theme.json "name" must be "${theme.name}"`);
  if (!meta.title || !meta.description) problems.push('theme.json needs "title" and a one-sentence "description"');
  if (!Array.isArray(meta.bestFor) || meta.bestFor.length < 5 || meta.bestFor.length > 10) problems.push('theme.json "bestFor" must list 5–10 plain words a customer would use');
  if (!Array.isArray(meta.mood) || meta.mood.length < 3 || meta.mood.length > 5) problems.push('theme.json "mood" must list 3–5 adjectives');
  const files = walk(dir).filter((f) => !f.startsWith(path.join(dir, 'sample') + path.sep) && path.basename(f) !== 'screenshot.png');
  const bytes = files.reduce((sum, f) => sum + fs.statSync(f).size, 0);
  if (bytes > MAX_BYTES) problems.push(`the theme is ${(bytes / 1024).toFixed(1)} KB (limit 45 KB without sample/ and screenshot.png)`);
  const enhance = path.join(dir, 'assets', 'enhance.js');
  if (fs.existsSync(enhance) && fs.statSync(enhance).size > MAX_ENHANCE_BYTES) problems.push('assets/enhance.js is over 3 KB');
  for (const file of ['assets/favicon.svg', 'screenshot.png']) if (!fs.existsSync(path.join(dir, file))) problems.push(`${file} is missing`);
  const flat = css.replace(/\s+/g, ' ');
  for (const [needle, what] of [['prefers-color-scheme:', 'a second colour scheme'], ['@media print', 'a print stylesheet'], ['prefers-reduced-motion', 'reduced-motion handling'], [':focus-visible', 'visible focus styles']]) {
    if (!flat.replace(/: /g, ':').includes(needle)) problems.push(`theme.css has no ${what}`);
  }
  if (/@import|@font-face|url\(\s*['"]?(https?:)?\/\//.test(css)) problems.push('theme.css imports, declares a web font, or loads an external URL — system fonts and local files only');
  for (const [name, def] of Object.entries(starter.collections || {})) {
    for (const field of def.fields || []) if (!field.type || (field.type === 'select' && !(field.options || []).length)) problems.push(`collection "${name}" field "${field.name}" needs a type (and options, for a select)`);
    if (def.render === false || !starter.sampleContent) continue;
    const items = walk(path.join(dir, starter.sampleContent, def.path)).filter((f) => f.endsWith('.md'));
    if (items.length < 6 || items.length > 12) problems.push(`collection "${name}" has ${items.length} sample items (6–12 make the theme look lived in)`);
  }
  for (const file of walk(path.join(dir, 'sample')).filter((f) => /\.(md|json)$/.test(f))) {
    const text = fs.readFileSync(file, 'utf8');
    if (/lorem ipsum/i.test(text)) problems.push(`${path.relative(dir, file)} contains lorem ipsum`);
    if (file.endsWith('.md') && !/^example:\s*true\s*$/m.test(text)) problems.push(`${path.relative(dir, file)} lacks "example: true"`);
  }
  return problems;
}

// ---------- the tests ----------

if (!themes.length) test('theme rules', { skip: 'no families/ folder — nothing to check on this site' }, () => {});

for (const theme of themes) {
  test(`theme ${theme.name} (${theme.meta.family}) meets the theme rules`, async () => {
    const css = fs.readFileSync(path.join(theme.dir, 'assets', 'theme.css'), 'utf8');
    const contract = readContract(theme.meta.family);
    const problems = [
      ...manifestProblems(theme, css),
      ...tokenProblems(theme, css),
      ...contrastProblems(css),
      ...templateProblems(theme),
      ...contractProblems(theme, contract, css),
    ];
    // Its own sample, the same without a single image, and a sibling's sample:
    // switching themes inside a family must need no content change.
    const sibling = themes.find((other) => other.meta.family === theme.meta.family && other.name !== theme.name && other.starter.sampleContent);
    for (const [label, content, options] of [['sample site', theme, {}], ['zero-image site', theme, { stripImages: true }], ...(sibling ? [[`with ${sibling.name}'s content`, sibling, {}]] : [])]) {
      const report = await buildSample(theme, content, options).catch((error) => ({ failed: error.message }));
      if (!report) continue;
      if (report.failed) { problems.push(`${label}: the build failed — ${report.failed}`); continue; }
      for (const warning of report.warnings) problems.push(`${label}: build warning — ${warning}`);
      problems.push(...outputProblems(label));
    }
    assert.deepEqual(problems, [], `themes/${theme.name} breaks the theme rules — fix the theme (or, for a contract line, read families/${theme.meta.family}.md)`);
  });
}
