// admin/js/appearance.js — themes, starters, try-on, customizer (cms-spec.md §10).
// The try-on renders the user's OWN pages with a candidate theme, entirely in
// the browser, using the same lib/template.js the build uses — what you
// preview is what deploys. Nothing is committed until Apply.

import { auth, getFile, putFile, listDir, listTree, commitFiles, bytesToBase64 } from './github.js';
import { h, toast, ask, watchBuild } from './ui.js';
import { render } from '../lib/template.js';
import { renderMarkdown } from '../lib/markdown.js';
import { parseFrontmatter } from '../lib/content.js';
import { collectionIndex } from './app.js';

/** Every theme in the repo: {name, title, description, starter?}. */
export async function loadThemes() {
  const dirs = (await listDir('themes')).filter((e) => e.type === 'dir');
  return Promise.all(dirs.map(async (dir) => {
    const meta = await getFile(`themes/${dir.name}/theme.json`).then((f) => JSON.parse(f.text)).catch(() => ({}));
    const starter = await getFile(`themes/${dir.name}/starter.json`).then((f) => JSON.parse(f.text)).catch(() => null);
    return { name: dir.name, title: meta.title || dir.name, description: meta.description || '', starter };
  }));
}

/** The design tokens declared at the top of a theme.css :root block. */
export function parseTokens(css) {
  const root = css.match(/:root\s*{([^}]*)}/);
  if (!root) return [];
  return [...root[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => ({ name: m[1], value: m[2].trim() }));
}

const installedSource = (name) => ({
  read: (p) => getFile(`themes/${name}/${p}`).then((f) => f.text),
  list: (d) => listDir(`themes/${name}/${d}`).then((es) => es.map((e) => e.name)),
});

async function sampleHome(src) {
  const md = await src.read('sample/content/pages/index.md').catch(() => null);
  if (!md) return null;
  const { data, body } = parseFrontmatter(md, 'index.md');
  return { ...data, url: '/', slug: 'index', collection: 'pages', content: renderMarkdown(body) };
}

/** Render a theme to a self-contained HTML doc (client-side, byte-identical to the build). source reads
 *  its files (default: installed themeName); sample:true → the theme's own sample home (thumbnails). */
export async function themePreview(themeName, siteInfo, { page, tokens = {}, scheme = 'light', sample = false, source } = {}) {
  const src = source || installedSource(themeName);
  const load = async (dir) => {
    const files = {};
    for (const n of (await src.list(dir).catch(() => [])).filter((x) => x.endsWith('.html'))) files[n.slice(0, -5)] = await src.read(`${dir}/${n}`);
    return files;
  };
  const [templates, partials, css0] = await Promise.all([load('templates'), load('templates/partials'), src.read('assets/theme.css')]);
  const css = scheme === 'dark' ? css0.replaceAll('@media (prefers-color-scheme: dark)', '@media all') : css0;
  const collections = {};
  let nav = siteInfo.navigation || [];
  if (sample) {
    page = await sampleHome(src);
    nav = await src.read('sample/data/navigation.json').then(JSON.parse).catch(() => nav);
  } else {
    for (const name of Object.keys(siteInfo.collections)) collections[name] = await collectionIndex(name);
    page = page || collections.pages?.find((p) => p.slug === 'index');
  }
  if (!page) page = { title: siteInfo.site.title, url: '/', content: '<p>Welcome.</p>', collection: 'pages' };
  nav = nav.map((e) => ({ ...e, current: e.url === page.url }));
  const context = { site: siteInfo.site, page, nav, data: { navigation: nav }, collections, feeds: [] };
  const body = render(templates[siteInfo.collections[page.collection]?.template || 'page'] || templates.page, context, partials);
  const tokenCss = Object.keys(tokens).length ? `<style>:root{${Object.entries(tokens).map(([k, v]) => `${k}:${v}`).join(';')}}</style>` : '';
  return render(templates.base, { ...context, body }, partials)
    .replace(/<link[^>]*\/assets\/theme\.css[^>]*>/, `<style>${css}</style>${tokenCss}`)
    .replace(/<script[^>]*enhance\.js[^>]*><\/script>/, '').replace(/<link rel="icon"[^>]*>\n?/, '');
}

/** A lazy, non-interactive thumbnail that live-renders a theme when scrolled into view. */
function themeThumb(getHtml, label) {
  const frame = h('iframe', { class: 'theme-thumb-frame', tabindex: '-1', 'aria-hidden': 'true', title: `Preview of ${label}` });
  const box = h('div', { class: 'thumb theme-thumb' }, frame);
  new IntersectionObserver((es, io) => es[0].isIntersecting && (io.disconnect(), getHtml()
    .then((html) => { frame.srcdoc = html; box.classList.add('ready'); })
    .catch(() => { box.classList.add('ready'); box.replaceChildren('🎨'); }))).observe(box);
  return box;
}

/**
 * Apply a starter (§10.3): merge its collections into config, set the theme
 * and the site block, optionally set navigation and install sample content.
 * Every write is a commit; returns the last commitSha.
 */
export async function applyStarter(theme, siteInfo, { site = {}, tokens = {}, navigation = true, samples = true, log = () => {} } = {}) {
  const starter = theme.starter || { starter: theme.name, collections: {} };
  log('Updating settings…');
  const configFile = await getFile('site.config.json');
  // Gather every change — config, navigation, and all sample files (copied by
  // their existing blob SHA, so binary covers survive) — into ONE atomic commit.
  const config = JSON.parse(configFile.text);
  Object.assign(config.site, site, { theme: theme.name });
  config.collections = { ...config.collections, ...starter.collections };
  if (Object.keys(tokens).length) config.theme = { ...(config.theme || {}), tokens };
  const files = [];

  // Replace, don't accumulate: a collection whose template the new theme lacks
  // was left by a previous theme's starter — drop it + delete its content (pages/
  // posts and user collections use universal templates, so they're never touched).
  const templates = new Set((await listDir(`themes/${theme.name}/templates`)).filter((e) => e.name.endsWith('.html')).map((e) => e.name.slice(0, -5)));
  for (const [name, def] of Object.entries(config.collections)) {
    if (!def.template || templates.has(def.template)) continue;
    log(`Removing the leftover ${name} collection…`);
    delete config.collections[name];
    for (const f of await listTree(`${def.path}/`)) files.push({ path: f.path, delete: true });
  }

  files.unshift({ path: 'site.config.json', content: JSON.stringify(config, null, 2) + '\n' });
  if (navigation && starter.navigation?.length) files.push({ path: 'data/navigation.json', content: JSON.stringify(starter.navigation, null, 2) + '\n' });

  const prefix = starter.sampleContent ? `themes/${theme.name}/${starter.sampleContent.replace(/\/$/, '')}/` : null;
  const sampleFiles = (samples && prefix) ? await listTree(prefix) : [];
  for (const f of sampleFiles) {
    const target = f.path.slice(prefix.length); // content/…, data/…, media/…
    if (target === 'data/navigation.json' && files.some((x) => x.path === target)) continue; // config's nav wins
    files.push({ path: target, sha: f.sha });
  }
  if (!sampleFiles.length) for (const def of Object.values(starter.collections || {})) files.push({ path: `${def.path}/.gitkeep`, content: '' });

  log('Publishing…');
  return (await commitFiles(files, `settings: apply the ${starter.starter} starter`)).commitSha;
}

const DEVICES = { Phone: '390px', Tablet: '768px', Desktop: '100%' };

export async function appearanceScreen(siteInfo) {
  const themes = await loadThemes();
  themes.sort((a, b) => (a.name === siteInfo.site.theme ? -1 : b.name === siteInfo.site.theme ? 1 : 0));

  const cards = themes.map((theme) => h('section', { class: 'card theme-card' },
    themeThumb(() => themePreview(theme.name, siteInfo, { sample: true }), theme.title),
    h('h2', {}, theme.title, theme.name === siteInfo.site.theme ? h('span', { class: 'badge' }, 'Active') : null),
    h('p', { class: 'muted' }, theme.description),
    h('div', { class: 'card-actions' },
      h('button', { class: 'primary', onclick: () => tryOn(theme, siteInfo) }, 'Preview with my content'))));

  return h('div', {},
    h('header', { class: 'screen-head' }, h('h1', {}, 'Appearance')),
    h('p', { class: 'muted' }, 'Try any look with your own pages before changing anything. Switching back is one click, and your content is never modified by a theme change.'),
    h('div', { class: 'cards' }, cards),
    h('h2', { class: 'browse-more' }, 'Browse more'),
    await registrySection(siteInfo, new Set(themes.map((t) => t.name))));
}

// Starter registry (§10.6): a static registry.json in the community starters
// repo; Install copies the starter folder into this repo — no servers.
const REGISTRY_REPO = 'plain-cms/starters';

/** Reads a not-yet-installed registry theme's files straight from its repo (raw = CDN, no API-rate cost). */
async function registrySource(entry) {
  const repo = entry.repo || REGISTRY_REPO, ref = entry.ref || 'main', prefix = entry.path || entry.id;
  const tree = await fetch(`https://api.github.com/repos/${repo}/git/trees/${ref}?recursive=1`).then((r) => r.json()).then((t) => t.tree || []);
  return {
    read: (p) => fetch(`https://raw.githubusercontent.com/${repo}/${ref}/${prefix}/${p}`).then((r) => { if (!r.ok) throw new Error(p); return r.text(); }),
    list: async (d) => tree.filter((f) => f.path.startsWith(`${prefix}/${d}/`) && !f.path.slice(prefix.length + d.length + 2).includes('/')).map((f) => f.path.split('/').pop()),
  };
}

async function registrySection(siteInfo, installed = new Set()) {
  const entries = (await fetch(`https://raw.githubusercontent.com/${REGISTRY_REPO}/main/registry.json`)
    .then((r) => (r.ok ? r.json() : [])).catch(() => [])).filter((e) => !installed.has(e.id));
  if (!entries.length) return h('p', { class: 'muted' }, 'Community starters will appear here as they’re published.');
  return h('div', { class: 'cards' }, entries.map((entry) => h('section', { class: 'card theme-card' },
    themeThumb(() => registrySource(entry).then((s) => themePreview(null, siteInfo, { sample: true, source: s })), entry.title || entry.id),
    h('h2', {}, entry.title || entry.id),
    h('p', { class: 'muted' }, `${entry.category ? `${entry.category} — ` : ''}${entry.description || ''}`),
    h('div', { class: 'card-actions' }, h('button', { class: 'primary', onclick: async (e) => {
      e.target.disabled = true;
      try {
        const repo = entry.repo || REGISTRY_REPO, ref = entry.ref || 'main', prefix = entry.path || entry.id;
        const { tree } = await fetch(`https://api.github.com/repos/${repo}/git/trees/${ref}?recursive=1`).then((r) => r.json());
        toast(`Installing ${entry.title || entry.id}…`);
        const files = [];
        for (const file of tree.filter((f) => f.type === 'blob' && f.path.startsWith(`${prefix}/`))) {
          const buf = await fetch(`https://raw.githubusercontent.com/${repo}/${ref}/${file.path}`).then((r) => r.arrayBuffer());
          files.push({ path: `themes/${entry.id}/${file.path.slice(prefix.length + 1)}`, base64: bytesToBase64(new Uint8Array(buf)) });
        }
        await commitFiles(files, `themes: install the ${entry.id} starter`);
        toast(`${entry.title || entry.id} installed — reload this screen to preview it.`, 'success');
      } catch (error) { toast(error.message, 'error'); e.target.disabled = false; }
    } }, 'Install')))));
}

/** Full-screen try-on with device widths, scheme toggle, and the token customizer. */
async function tryOn(theme, siteInfo) {
  const state = { tokens: {}, scheme: 'light', page: null };
  const iframe = h('iframe', { class: 'tryon-frame', title: `Preview of ${theme.title}` });
  const posts = Object.keys(siteInfo.collections).filter((n) => siteInfo.collections[n].listUrl);
  const latestPost = posts.length ? (await collectionIndex(posts[0]))[0] : null;

  async function refresh() {
    try {
      iframe.srcdoc = await themePreview(theme.name, siteInfo, state);
    } catch (error) { toast(error.message, 'error'); }
  }

  const css = (await getFile(`themes/${theme.name}/assets/theme.css`)).text;
  const tokenRows = parseTokens(css).map((token) => {
    const isColor = /^#[0-9a-fA-F]{6}$/.test(token.value);
    const input = h('input', { type: isColor ? 'color' : 'text', value: token.value });
    input.addEventListener('input', () => { state.tokens[token.name] = input.value; refresh(); });
    return h('label', { class: 'token' }, token.name.slice(2), input,
      h('button', { class: 'linklike', title: 'Reset', onclick: () => { delete state.tokens[token.name]; input.value = token.value; refresh(); } }, '↺'));
  });
  const customizer = h('aside', { class: 'tryon-tokens', hidden: '' },
    h('h2', {}, 'Customize'),
    h('p', { class: 'muted' }, 'Changes preview instantly and apply with the theme. Your tweaks survive theme updates.'),
    tokenRows,
    h('button', { class: 'linklike', onclick: () => { state.tokens = {}; overlay.remove(); tryOn(theme, siteInfo); } }, 'Reset all'));

  async function apply() {
    const starter = theme.starter && Object.keys(theme.starter.collections || {}).length
      ? await ask({ title: `Use the full ${theme.title} starter?`, message: 'The starter adds its content types, menu, and example content. "Theme only" changes the look and touches nothing else.', actions: [{ label: 'Cancel', value: null }, { label: 'Theme only', value: false }, { label: 'Full starter', value: true, kind: 'primary' }] })
      : false;
    if (starter === null) return;
    try {
      let commitSha;
      if (starter) {
        commitSha = await applyStarter(theme, siteInfo, { tokens: state.tokens, log: (m) => toast(m) });
      } else {
        const file = await getFile('site.config.json');
        const config = JSON.parse(file.text);
        config.site.theme = theme.name;
        if (Object.keys(state.tokens).length) config.theme = { ...(config.theme || {}), tokens: state.tokens };
        ({ commitSha } = await putFile('site.config.json', JSON.stringify(config, null, 2) + '\n', `settings: switch theme to "${theme.name}"`, file.sha));
      }
      toast('Applied — your site is updating. Switching back is just as easy.', 'success');
      watchBuild(commitSha, siteInfo.site.url);
      overlay.remove();
    } catch (error) { toast(error.message, 'error'); }
  }

  const button = (label, onclick, cls = '') => h('button', { class: cls, onclick }, label);
  const overlay = h('div', { class: 'tryon' },
    h('header', { class: 'tryon-bar' },
      h('strong', {}, theme.title),
      h('span', { class: 'tryon-group' }, ...Object.entries(DEVICES).map(([label, width]) => button(label, () => { iframe.style.width = width; }))),
      button('Light/Dark', () => { state.scheme = state.scheme === 'light' ? 'dark' : 'light'; refresh(); }),
      latestPost ? button('Home/Post', () => { state.page = state.page ? null : latestPost; refresh(); }) : null,
      button('Customize', () => { customizer.hidden = !customizer.hidden; }),
      button('Apply', apply, 'primary'),
      button('Close', () => overlay.remove())),
    h('div', { class: 'tryon-body' }, iframe, customizer));
  document.body.append(overlay);
  refresh();
}
