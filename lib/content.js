// lib/content.js — parse frontmatter, validate content and config (cms-spec.md §5).
// Frontmatter is a deliberately small, hand-parsed subset of YAML: "key: value"
// scalars (strings, true/false, numbers, "quoted") and "key:" + indented
// "- item" lists. No nesting, no multiline values, no anchors. Errors name
// the file, line, and fix. Isomorphic — the admin validates and serializes
// with this exact module in the browser; filesystem scanning lives in build.js.

import { slugify, isIsoDate, formatDate } from './util.js';

/** A build-stopping problem in a specific file. Message includes file:line. */
export class ContentError extends Error {
  constructor(file, line, message) {
    super(line ? `${file}:${line} — ${message}` : `${file} — ${message}`);
    this.file = file;
    this.line = line;
  }
}

/** Parse one scalar frontmatter value: booleans, numbers, quoted or bare strings. */
function parseScalar(raw) {
  const value = raw.trim();
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  const quoted = value.match(/^"(.*)"$|^'(.*)'$/);
  if (quoted) return quoted[1] ?? quoted[2];
  return value;
}

/**
 * Parse a content file into frontmatter data + Markdown body.
 * @returns {{data: object, body: string, lineOf: Record<string, number>}}
 */
export function parseFrontmatter(source, file = 'content file') {
  const lines = source.split(/\r?\n/);
  if (lines[0]?.trim() !== '---') {
    throw new ContentError(file, 1, 'file must start with "---" on its own line, followed by frontmatter like "title: My title"');
  }
  const data = {};
  const lineOf = {};
  let listKey = null;
  let i = 1;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '---') break;
    if (line.trim() === '') { listKey = null; continue; }
    const listItem = line.match(/^\s*-\s+(.*)$/);
    if (listItem && listKey) {
      data[listKey].push(parseScalar(listItem[1]));
      continue;
    }
    const pair = line.match(/^([A-Za-z][\w-]*):(.*)$/);
    if (!pair) {
      throw new ContentError(file, i + 1, `cannot parse "${line.trim()}" — expected "key: value" or an indented "- item" list entry`);
    }
    const [, key, rest] = pair;
    lineOf[key] = i + 1;
    if (rest.trim() === '') {
      data[key] = [];       // "key:" alone opens a list
      listKey = key;
    } else {
      data[key] = parseScalar(rest);
      listKey = null;
    }
  }
  if (i >= lines.length) {
    throw new ContentError(file, lines.length, 'frontmatter never ends — add a closing "---" line');
  }
  return { data, body: lines.slice(i + 1).join('\n'), lineOf };
}

/** True when a string value must be quoted to survive a parse round-trip. */
function needsQuotes(value) {
  return value === '' || /^(true|false)$/.test(value) || /^-?\d+(\.\d+)?$/.test(value)
    || /^["']/.test(value) || /^\s|\s$/.test(value) || /^-\s/.test(value);
}

/**
 * Serialize data + body back into a content file (the admin's save path).
 * Keys in fieldOrder come first, in that order; unknown keys keep their place after.
 */
export function serializeFrontmatter(data, body, fieldOrder = []) {
  const keys = [...fieldOrder.filter((k) => k in data), ...Object.keys(data).filter((k) => !fieldOrder.includes(k))];
  const lines = ['---'];
  for (const key of keys) {
    const value = data[key];
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) lines.push(`  - ${item}`);
    } else if (typeof value === 'string') {
      if (value.includes('\n')) throw new ContentError(key, null, `field "${key}" contains a line break — frontmatter values must be a single line`);
      lines.push(`${key}: ${needsQuotes(value) ? JSON.stringify(value) : value}`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  lines.push('---', '');
  return lines.join('\n') + (body.startsWith('\n') ? body : `\n${body}`);
}

const FIELD_TYPES = ['text', 'textarea', 'date', 'boolean', 'image', 'list', 'select'];

/** Validate one item's data against its collection's field schema. Mutates data to apply defaults. */
export function validateFields(data, fields, file, lineOf = {}) {
  for (const field of fields) {
    const value = data[field.name];
    const at = lineOf[field.name] || 1;
    if (value === undefined) {
      if ('default' in field) data[field.name] = field.default;
      else if (field.required) throw new ContentError(file, 1, `missing required field "${field.name}" — add "${field.name}: …" to the frontmatter`);
      continue;
    }
    switch (field.type) {
      case 'date': if (!isIsoDate(value)) throw new ContentError(file, at, `field "${field.name}" must be an ISO date like 2026-07-05 (got "${value}")`); break;
      case 'boolean': if (typeof value !== 'boolean') throw new ContentError(file, at, `field "${field.name}" must be true or false (got "${value}")`); break;
      case 'list': if (!Array.isArray(value)) throw new ContentError(file, at, `field "${field.name}" must be a list — write "${field.name}:" then indented "- item" lines`); break;
      case 'select': if (!field.options?.includes(value)) throw new ContentError(file, at, `field "${field.name}" must be one of: ${(field.options || []).join(', ')} (got "${value}")`); break;
      default: // text, textarea, image
        if (typeof value === 'number') data[field.name] = String(value);
        else if (typeof value !== 'string') throw new ContentError(file, at, `field "${field.name}" must be text (got ${JSON.stringify(value)})`);
    }
  }
}

/** Build an item's URL from its collection's pattern. "index" maps to the pattern root. */
export function urlFor(pattern, slug) {
  const url = slug === 'index' ? pattern.replace(/:slug\/?$/, '') : pattern.replace(':slug', slug);
  return url.endsWith('/') ? url : `${url}/`;
}

/**
 * Turn one content file's source into a validated item. The caller (build.js
 * on disk, the admin in the browser) supplies the file's source and identity.
 */
export function makeItem(source, { file, slug, collection, def, language = 'en' }) {
  if (slug !== slugify(slug) || slug === '') throw new ContentError(file, null, `filename must be a slug (lowercase letters, digits, hyphens) — rename it to "${slugify(slug) || 'untitled'}.md"`);
  const { data, body, lineOf } = parseFrontmatter(source, file);
  validateFields(data, def.fields, file, lineOf);
  const item = { ...data, slug, url: urlFor(def.urlPattern, slug), file, collection, body };
  if (isIsoDate(item.date)) item.dateFormatted = formatDate(item.date, language);
  return item;
}

/** Sort a collection's items in place by its sortBy/sortOrder config. */
export function sortItems(items, def) {
  if (!def.sortBy) return items;
  const direction = def.sortOrder === 'asc' ? 1 : -1;
  return items.sort((a, b) => (a[def.sortBy] > b[def.sortBy] ? direction : a[def.sortBy] < b[def.sortBy] ? -direction : 0));
}

/** Validate site.config.json. Throws ContentError with a fix for each problem. */
export function validateConfig(config) {
  const file = 'site.config.json';
  if (!config.site || typeof config.site !== 'object') throw new ContentError(file, null, 'missing "site" section — add { "site": { "title": …, "url": … } }');
  if (!config.site.title) throw new ContentError(file, null, 'missing "site.title" — the site needs a name');
  if (!/^https?:\/\//.test(config.site.url || '')) throw new ContentError(file, null, `"site.url" must be a full URL like "https://example.com" (got "${config.site.url}")`);
  config.site.url = config.site.url.replace(/\/$/, '');
  config.site.language ||= 'en';
  config.site.theme ||= 'default';
  config.collections ||= {};
  config.plugins ||= [];
  config.services ||= {};
  if (typeof config.services !== 'object' || Array.isArray(config.services)) throw new ContentError(file, null, '"services" must be a map of name → URL, e.g. { "backend": "https://api.example.com" }');
  for (const [name, url] of Object.entries(config.services)) {
    if (typeof url !== 'string' || !/^https:\/\/\S+$/.test(url)) throw new ContentError(file, null, `"services.${name}" must be an https:// URL string (got ${JSON.stringify(url)}) — endpoints only; never put keys or secrets here, this value is published on every page`);
    config.services[name] = url.replace(/\/+$/, '');
  }
  for (const [name, def] of Object.entries(config.collections)) {
    const where = `collection "${name}"`;
    if (!def.path) throw new ContentError(file, null, `${where} is missing "path" — e.g. "content/${name}"`);
    if (!def.urlPattern?.startsWith('/') || !def.urlPattern.includes(':slug')) throw new ContentError(file, null, `${where} needs a "urlPattern" starting with "/" and containing ":slug" — e.g. "/${name}/:slug/"`);
    if (!def.template) throw new ContentError(file, null, `${where} is missing "template" — the theme template name to render items with`);
    if (def.listUrl && !def.listTemplate) throw new ContentError(file, null, `${where} has "listUrl" but no "listTemplate" — add e.g. "listTemplate": "list"`);
    def.fields ||= [];
    for (const field of def.fields) {
      if (!field.name) throw new ContentError(file, null, `${where} has a field without a "name"`);
      if (!FIELD_TYPES.includes(field.type)) throw new ContentError(file, null, `${where} field "${field.name}" has unknown type "${field.type}" — use one of: ${FIELD_TYPES.join(', ')}`);
      if (field.type === 'select' && !Array.isArray(field.options)) throw new ContentError(file, null, `${where} select field "${field.name}" needs an "options" list`);
    }
    def.sortOrder ||= 'desc';
    def.pageSize ||= 10;
    def.label ||= name.charAt(0).toUpperCase() + name.slice(1);
  }
  return config;
}
