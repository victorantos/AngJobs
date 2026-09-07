// admin/js/plugins.js — browse, install, configure and remove plugins.
// Installed plugins come from the site's own repo (site.config.json + each
// plugins/<name>/plugin.json); available ones from the curated community
// registry (a static registry.json). Install copies the plugin folder into
// plugins/<id>/ and enables it in site.config.json in ONE commit — mirroring
// the starter registry (appearance.js). Plugins are code, so cards show
// provenance and where the plugin runs, and nothing is installed silently.

import { getFile, updateFile, listDir, listTree, commitFiles, bytesToBase64, cmpVersion } from './github.js';
import { h, toast, ask, modal, watchBuild } from './ui.js';

export const REGISTRY_REPO = 'plain-cms/plugins';
const ENGINE_REPO = 'plain-cms/plain';
const RUNS = { client: 'client-only', build: 'build-time', both: 'build + client' };
const refresh = () => setTimeout(() => dispatchEvent(new HashChangeEvent('hashchange')), 700);

/** A plugin's files from the registry as commitFiles entries under plugins/<id>/, plus its manifest.
 *  `entry` may be an id string or {id, repo?, ref?, path?}. Shared with the starter bundler. */
export async function fetchPluginFiles(entry) {
  const spec = typeof entry === 'string' ? { id: entry } : entry;
  const repo = spec.repo || REGISTRY_REPO, ref = spec.ref || 'main', prefix = spec.path || spec.id;
  const { tree = [] } = await fetch(`https://api.github.com/repos/${repo}/git/trees/${ref}?recursive=1`).then((r) => r.json());
  const files = [];
  let manifest = null;
  for (const file of tree.filter((f) => f.type === 'blob' && f.path.startsWith(`${prefix}/`))) {
    const rel = file.path.slice(prefix.length + 1);
    const buf = await fetch(`https://raw.githubusercontent.com/${repo}/${ref}/${file.path}`).then((r) => r.arrayBuffer());
    if (rel === 'plugin.json') { try { manifest = JSON.parse(new TextDecoder().decode(buf)); } catch { /* leave null */ } }
    files.push({ path: `plugins/${spec.id}/${rel}`, base64: bytesToBase64(new Uint8Array(buf)) });
  }
  return { files, manifest };
}

/** Installed plugins: config.plugins[] joined with each plugins/<name>/plugin.json. */
async function loadInstalled() {
  const config = JSON.parse((await getFile('site.config.json')).text);
  const names = config.plugins || [];
  const manifests = await Promise.all(names.map((name) =>
    getFile(`plugins/${name}/plugin.json`).then((f) => JSON.parse(f.text)).catch(() => ({ name, description: '(manifest not found)' }))));
  return names.map((name, i) => ({ name, manifest: manifests[i], options: (config.pluginOptions || {})[name] || {} }));
}

/** Plugins that ship in plugins/ but aren't enabled — so newly shipped built-ins
 *  (and anything you removed from the list) stay discoverable and one click to turn on. */
async function loadAvailableLocal(enabled) {
  const dirs = (await listDir('plugins')).filter((e) => e.type === 'dir' && !enabled.has(e.name));
  const manifests = await Promise.all(dirs.map((d) =>
    getFile(`plugins/${d.name}/plugin.json`).then((f) => JSON.parse(f.text)).catch(() => null)));
  return dirs.map((d, i) => ({ name: d.name, manifest: manifests[i] })).filter((p) => p.manifest);
}

const hasOptions = (p) => Object.keys({ ...(p.manifest.options || {}), ...p.options }).length > 0;

/** The community registry — one fetch, [] when unreachable. */
const loadRegistry = () => fetch(`https://raw.githubusercontent.com/${REGISTRY_REPO}/main/registry.json`)
  .then((r) => (r.ok ? r.json() : [])).catch(() => []);

/** Where an installed plugin's published copy lives: its registry entry, or the
 *  engine repo for built-ins. A purely local plugin resolves to a 404 later and
 *  simply never offers updates. */
function updateSource(name, registry) {
  const entry = registry.find((e) => e.id === name);
  if (entry) return { id: name, repo: entry.repo || REGISTRY_REPO, ref: entry.ref, path: entry.path };
  return { id: name, repo: ENGINE_REPO, path: `plugins/${name}` };
}

/** Installed plugins whose published plugin.json carries a newer version —
 *  checked in parallel against raw.githubusercontent.com (no API quota). */
async function pluginUpdates(installed, registry) {
  const checks = installed.map(async (p) => {
    if (!p.manifest.version) return null;
    const source = updateSource(p.name, registry);
    const raw = `https://raw.githubusercontent.com/${source.repo}/${source.ref || 'main'}/${source.path || source.id}/plugin.json`;
    const latest = await fetch(raw).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    if (!latest?.version || cmpVersion(latest.version, p.manifest.version) <= 0) return null;
    return { name: p.name, title: p.manifest.title || p.name, current: p.manifest.version, latest: latest.version, source };
  });
  return (await Promise.all(checks)).filter(Boolean);
}

/** Dashboard notice (§14.5 for plugins): which installed plugins have a newer
 *  published version, linking to the plugins screen to apply them. */
export async function pluginUpdatesCard() {
  let updates = [];
  try { updates = await pluginUpdates(await loadInstalled(), await loadRegistry()); } catch { return null; }
  if (!updates.length) return null;
  return h('section', { class: 'card update' },
    h('h2', {}, updates.length === 1 ? `Plugin update available — ${updates[0].title} v${updates[0].latest}` : `Plugin updates available (${updates.length})`),
    h('p', { class: 'muted' }, `${updates.map((u) => `${u.title} v${u.current} → v${u.latest}`).join(', ')}. Each update is one commit you can revert.`),
    h('p', { class: 'update-actions' }, h('a', { class: 'button primary', href: '#/plugins' }, 'Review & update')));
}

/** Replace plugins/<name>/ with the latest published copy — one commit; your
 *  settings live in site.config.json and are untouched. */
async function updatePlugin(p, update, siteInfo, button) {
  if (!await ask({ title: `Update ${update.title} to v${update.latest}?`,
    message: `This replaces the plugin's files with the latest published version (you're on v${update.current}). Your settings are kept; revert the commit to roll back.`,
    actions: [{ label: 'Cancel', value: null }, { label: 'Update', value: true, kind: 'primary' }] })) return;
  button.disabled = true;
  try {
    const { files } = await fetchPluginFiles(update.source);
    if (!files.length) throw new Error('The published copy of this plugin has no files.');
    const keep = new Set(files.map((f) => f.path));
    for (const f of await listTree(`plugins/${p.name}/`)) if (!keep.has(f.path)) files.push({ path: f.path, delete: true });
    const { commitSha } = await commitFiles(files, `plugins: update ${p.name} to v${update.latest}`);
    toast(`${update.title} updated to v${update.latest} — publishing now.`, 'success');
    watchBuild(commitSha, siteInfo.site.url);
    refresh();
  } catch (error) { toast(error.message, 'error'); button.disabled = false; }
}

export async function pluginsScreen(siteInfo) {
  const installed = await loadInstalled();
  const names = new Set(installed.map((p) => p.name));
  const [available, registry] = await Promise.all([loadAvailableLocal(names), loadRegistry()]);
  const updates = new Map((await pluginUpdates(installed, registry)).map((u) => [u.name, u]));

  const cards = installed.map((p) => {
    const update = updates.get(p.name);
    return h('section', { class: 'card plugin-card' },
      h('h2', {}, p.manifest.title || p.name, p.manifest.version ? h('span', { class: 'badge' }, `v${p.manifest.version}`) : null),
      h('p', { class: 'muted' }, p.manifest.description || ''),
      p.manifest.note ? h('p', { class: 'plugin-hint' }, p.manifest.note) : null,
      h('div', { class: 'card-actions' },
        update ? h('button', { class: 'primary', onclick: (e) => updatePlugin(p, update, siteInfo, e.target) }, `Update to v${update.latest}`) : null,
        hasOptions(p) ? h('button', { onclick: () => configurePlugin(p, siteInfo) }, 'Configure') : null,
        h('button', { class: 'danger', onclick: () => removePlugin(p, siteInfo) }, 'Remove')));
  });

  const builtinCards = available.map((p) => h('section', { class: 'card plugin-card' },
    h('h2', {}, p.manifest.title || p.name, p.manifest.version ? h('span', { class: 'badge' }, `v${p.manifest.version}`) : null),
    h('p', { class: 'muted' }, p.manifest.description || ''),
    p.manifest.note ? h('p', { class: 'plugin-hint' }, p.manifest.note) : null,
    h('div', { class: 'card-actions' },
      h('button', { class: 'primary', onclick: (e) => enablePlugin(p, siteInfo, e.target) }, 'Enable'))));

  return h('div', {},
    h('header', { class: 'screen-head' }, h('h1', {}, 'Plugins')),
    h('p', { class: 'muted' }, 'Optional features for your site. Installing copies the plugin into your repository and turns it on; removing reverses both.'),
    installed.length ? h('div', { class: 'cards' }, cards) : h('p', { class: 'empty' }, 'No plugins installed.'),
    available.length ? h('h2', { class: 'browse-more' }, 'Built-in — not enabled') : null,
    available.length ? h('p', { class: 'muted' }, 'These ship with plain but aren’t turned on for this site yet. Enabling one just adds it to your config.') : null,
    available.length ? h('div', { class: 'cards' }, builtinCards) : null,
    h('h2', { class: 'browse-more' }, 'Add a plugin'),
    h('p', { class: 'plugin-note' }, 'Plugins run code on your site — some in your visitors’ browsers, some when your site builds. Install only ones you trust; every plugin below is reviewed before it’s listed.'),
    registrySection(siteInfo, names, registry));
}

function registrySection(siteInfo, installed, registry) {
  const entries = registry.filter((e) => e.id && !installed.has(e.id));
  if (!entries.length) return h('p', { class: 'muted' }, 'Community plugins will appear here as they’re published.');
  return h('div', { class: 'cards' }, entries.map((entry) => {
    const src = entry.repo || REGISTRY_REPO;
    return h('section', { class: 'card plugin-card' },
      h('h2', {}, entry.title || entry.id,
        entry.runsAt ? h('span', { class: `badge runs runs-${entry.runsAt}` }, RUNS[entry.runsAt] || entry.runsAt) : null),
      h('p', { class: 'muted' }, `${entry.category ? `${entry.category} — ` : ''}${entry.description || ''}`),
      h('p', { class: 'provenance' },
        entry.author ? h('span', {}, `by ${entry.author}`) : null,
        h('a', { href: `https://github.com/${src}`, target: '_blank', rel: 'noopener' }, src)),
      h('div', { class: 'card-actions' },
        h('button', { class: 'primary', onclick: (e) => installPlugin(entry, siteInfo, e.target) }, 'Install')));
  }));
}

/** Copy the plugin into plugins/<id>/ and enable it in site.config.json — one commit. */
async function installPlugin(entry, siteInfo, button) {
  const runs = RUNS[entry.runsAt] || 'code';
  if (!await ask({ title: `Install ${entry.title || entry.id}?`,
    message: `This copies the plugin into your repository and turns it on. It runs ${runs} on your site — you can remove it anytime.`,
    actions: [{ label: 'Cancel', value: null }, { label: 'Install', value: true, kind: 'primary' }] })) return;
  button.disabled = true;
  try {
    toast(`Installing ${entry.title || entry.id}…`);
    const { files, manifest } = await fetchPluginFiles(entry);
    if (!files.length) throw new Error('That plugin has no files in the registry.');
    const cfg = await getFile('site.config.json');
    const config = JSON.parse(cfg.text);
    config.plugins = [...new Set([...(config.plugins || []), entry.id])];
    if (manifest?.options && Object.keys(manifest.options).length) {
      config.pluginOptions = config.pluginOptions || {};
      config.pluginOptions[entry.id] = { ...manifest.options, ...(config.pluginOptions[entry.id] || {}) };
    }
    files.unshift({ path: 'site.config.json', content: JSON.stringify(config, null, 2) + '\n' });
    const { commitSha } = await commitFiles(files, `plugins: install the ${entry.id} plugin`);
    toast(`${entry.title || entry.id} installed — publishing now.`, 'success');
    watchBuild(commitSha, siteInfo.site.url);
    refresh();
  } catch (error) { toast(error.message, 'error'); button.disabled = false; }
}

/** Turn on a plugin that already ships in plugins/ — just add it to the config. */
async function enablePlugin(p, siteInfo, button) {
  button.disabled = true;
  try {
    const { commitSha } = await updateFile('site.config.json', (text) => {
      const config = JSON.parse(text);
      config.plugins = [...new Set([...(config.plugins || []), p.name])];
      if (p.manifest?.options && Object.keys(p.manifest.options).length) {
        config.pluginOptions = config.pluginOptions || {};
        config.pluginOptions[p.name] = { ...p.manifest.options, ...(config.pluginOptions[p.name] || {}) };
      }
      return JSON.stringify(config, null, 2) + '\n';
    }, `plugins: enable ${p.name}`);
    toast(`${p.manifest.title || p.name} enabled — publishing now.`, 'success');
    if (commitSha) watchBuild(commitSha, siteInfo.site.url);
    refresh();
  } catch (error) { toast(error.message, 'error'); }
}

/** Delete plugins/<name>/ and turn it off in site.config.json — one commit. */
async function removePlugin(p, siteInfo) {
  const label = p.manifest.title || p.name;
  if (!await ask({ title: `Remove ${label}?`, message: 'This deletes the plugin from your repository and turns it off. You can install it again later.',
    actions: [{ label: 'Cancel', value: null }, { label: 'Remove', value: true, kind: 'danger' }] })) return;
  try {
    const cfg = await getFile('site.config.json');
    const config = JSON.parse(cfg.text);
    config.plugins = (config.plugins || []).filter((n) => n !== p.name);
    if (config.pluginOptions) delete config.pluginOptions[p.name];
    const files = [{ path: 'site.config.json', content: JSON.stringify(config, null, 2) + '\n' }];
    for (const f of await listTree(`plugins/${p.name}/`)) files.push({ path: f.path, delete: true });
    const { commitSha } = await commitFiles(files, `plugins: remove the ${p.name} plugin`);
    toast(`${label} removed — publishing now.`, 'success');
    watchBuild(commitSha, siteInfo.site.url);
    refresh();
  } catch (error) { toast(error.message, 'error'); }
}

/** Edit a plugin's options (pluginOptions.<name>) with a small form inferred from the current values. */
async function configurePlugin(p, siteInfo) {
  const current = { ...(p.manifest.options || {}), ...p.options };
  const fields = Object.entries(current).map(([key, val]) => {
    const type = val && typeof val === 'object' ? 'json' : typeof val;
    let input;
    if (type === 'boolean') input = h('input', { type: 'checkbox', ...(val ? { checked: '' } : {}) });
    else if (type === 'number') input = h('input', { type: 'number', value: String(val) });
    else if (type === 'json') input = h('textarea', { rows: '4' }, JSON.stringify(val, null, 2));
    else input = h('input', { type: 'text', value: val == null ? '' : String(val) });
    return { key, type, input };
  });
  const ok = await modal('plugin-config', (done) => [
    h('h2', {}, `Configure ${p.manifest.title || p.name}`),
    h('div', { class: 'form' }, fields.map((f) => h('label', { class: 'field' }, f.key, f.input))),
    h('div', { class: 'ask-actions' },
      h('button', { onclick: () => done(null) }, 'Cancel'),
      h('button', { class: 'primary', onclick: () => done(true) }, 'Save')),
  ]);
  if (!ok) return;
  const next = {};
  try {
    for (const f of fields) {
      if (f.type === 'boolean') next[f.key] = f.input.checked;
      else if (f.type === 'number') next[f.key] = Number(f.input.value);
      else if (f.type === 'json') next[f.key] = JSON.parse(f.input.value);
      else next[f.key] = f.input.value;
    }
  } catch { return toast('One field has invalid JSON — fix it and try again.', 'error'); }
  try {
    const { commitSha } = await updateFile('site.config.json', (text) => {
      const config = JSON.parse(text);
      config.pluginOptions = { ...(config.pluginOptions || {}), [p.name]: next };
      return JSON.stringify(config, null, 2) + '\n';
    }, `plugins: configure ${p.name}`);
    toast('Saved — publishing now.', 'success');
    if (commitSha) watchBuild(commitSha, siteInfo.site.url);
  } catch (error) { toast(error.message, 'error'); }
}
