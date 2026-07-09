// admin/js/app.js — screens and routing for the admin.
// A single-page vanilla app. Reads the published static API for schema and
// content metadata; writes through the GitHub API (see github.js).
// UI language rule: never "commit/push/branch" — always "save/publish/history".

import { auth, repoInfo, getFile, putFile, listDir, commitsFor, runFor, dispatchWorkflow, cmpVersion } from './github.js';
import { h, show, toast, timeAgo, watchBuild, ask } from './ui.js';
import { editorScreen } from './editor.js';
import { mediaScreen } from './media.js';
import { aiSettings } from './ai.js';
import { appearanceScreen } from './appearance.js';
import { wizardScreen } from './wizard.js';

let siteInfo = null;             // parsed /api/site.json (schema + site block)
const indexCache = new Map();    // collection name → published items

export async function collectionIndex(name) {
  if (!indexCache.has(name)) {
    const items = await fetch(`../api/${name}/index.json`).then((r) => (r.ok ? r.json() : { items: [] })).then((d) => d.items).catch(() => []);
    indexCache.set(name, items);
  }
  return indexCache.get(name);
}

export const singular = (name) => (name.endsWith('s') ? name.slice(0, -1) : name);

/** Confirm, then clear the stored credentials and return to the sign-in screen. */
async function signOut() {
  if (await ask({ title: 'Sign out?', message: 'You’ll sign in again next time. Nothing is lost — your work lives in GitHub.', actions: [{ label: 'Stay', value: null }, { label: 'Sign out', value: true, kind: 'danger' }] })) { auth.clear(); route(); }
}

function shell(active, ...content) {
  const collections = Object.entries(siteInfo?.collections || {});
  const link = (href, label, key) => h('a', { href, class: key === active ? 'current' : '' }, label);
  return h('div', { class: 'layout' },
    h('nav', { class: 'sidebar' },
      h('a', { class: 'brand', href: '#/' }, siteInfo?.site.title || 'Admin'),
      link('#/', 'Dashboard', 'dashboard'),
      collections.map(([name, def]) => link(`#/collection/${name}`, def.label, `collection:${name}`)),
      link('#/media', 'Media', 'media'),
      link('#/navigation', 'Navigation', 'navigation'),
      link('#/appearance', 'Appearance', 'appearance'),
      link('#/settings', 'Settings', 'settings'),
      h('div', { class: 'sidebar-foot' },
        h('a', { href: siteInfo?.site.url || '/', target: '_blank', rel: 'noopener' }, 'View site ↗'),
        h('button', { class: 'linklike signout', onclick: signOut }, `Sign out${auth.repo ? ` (${auth.repo})` : ''}`)),
    ),
    h('main', { class: 'screen' }, ...content),
  );
}

function guessRepo() {
  const host = location.hostname;
  if (!host.endsWith('.github.io')) return '';
  const owner = host.split('.')[0];
  const segments = location.pathname.split('/').filter(Boolean); // e.g. ["myrepo", "admin"]
  return segments.length >= 2 ? `${owner}/${segments[0]}` : `${owner}/${host}`;
}

/** Open the OAuth Worker's popup and resolve with the token it postMessages back (§3 v2). */
function oauthPopup(oauthUrl) {
  return new Promise((resolve, reject) => {
    const origin = new URL(oauthUrl).origin;
    const win = window.open(`${oauthUrl.replace(/\/$/, '')}/login`, 'plain-oauth', 'width=700,height=800');
    if (!win) return reject(new Error('Your browser blocked the sign-in window — allow popups for this site and try again.'));
    const done = () => { clearInterval(poll); removeEventListener('message', onMsg); };
    const onMsg = (e) => { if (e.origin === origin && e.data?.type === 'plain-oauth') { done(); resolve(e.data.token); } };
    const poll = setInterval(() => { if (win.closed) { done(); reject(new Error('Sign-in was cancelled.')); } }, 500);
    addEventListener('message', onMsg);
  });
}

function signinScreen() {
  const oauthUrl = siteInfo?.site.oauthUrl;   // set → offer "Sign in with GitHub" (worker deployed)
  const repo = h('input', { type: 'text', placeholder: 'owner/repository', value: auth.repo || guessRepo() || siteInfo?.site.repo || '', autocomplete: 'off' });
  const token = h('input', { type: 'password', placeholder: 'github_pat_…', autocomplete: 'off' });
  const branch = h('input', { type: 'text', value: auth.branch });

  // Shared tail: store the token, verify it against the repo, and enter the app.
  async function finish(accessToken, reEnable) {
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo.value.trim())) { reEnable(); return toast('Set the repository as owner/name — copy it from the repository page URL.', 'error'); }
    auth.save({ repo: repo.value.trim(), token: accessToken, branch: branch.value.trim() || 'main' });
    try { await repoInfo(); toast('Welcome!', 'success'); location.hash = '#/'; route(); }
    catch (error) { auth.clear(); reEnable(); toast(error.message, 'error'); }
  }

  const ghButton = oauthUrl ? h('button', { class: 'primary gh', onclick: async () => {
    if (!repo.value.trim()) repo.value = guessRepo() || siteInfo?.site.repo || '';
    ghButton.disabled = true;
    try { await finish(await oauthPopup(oauthUrl), () => { ghButton.disabled = false; }); }
    catch (error) { ghButton.disabled = false; toast(error.message, 'error'); }
  } }, 'Sign in with GitHub') : null;

  const patButton = h('button', { class: 'primary', onclick: () => {
    if (!token.value.trim()) return toast('Paste an access token — see “Where do I get a token?” below.', 'error');
    patButton.disabled = true; finish(token.value.trim(), () => { patButton.disabled = false; });
  } }, 'Sign in');

  const tokenForm = h('div', {},
    h('label', {}, 'Repository', repo),
    h('label', {}, 'Access token', token),
    h('details', {}, h('summary', {}, 'Advanced: branch'), h('label', {}, 'Branch', branch)),
    patButton,
    h('details', { class: 'help' },
      h('summary', {}, 'Where do I get a token?'),
      h('ol', {},
        h('li', {}, 'On GitHub, open Settings → Developer settings → Fine-grained tokens → Generate new token.'),
        h('li', {}, 'Under “Repository access”, choose Only select repositories and pick this site’s repository.'),
        h('li', {}, 'Under “Permissions → Repository permissions”, set Contents to Read and write, and Actions to Read-only.'),
        h('li', {}, 'Generate, copy the token, and paste it above. You won’t need to do this again on this device.'))));

  return h('div', { class: 'signin' },
    h('h1', {}, 'Welcome back'),
    oauthUrl
      ? h('div', {}, h('p', {}, 'Sign in with your GitHub account to publish and manage content.'), ghButton,
          h('details', { class: 'token-alt' }, h('summary', {}, 'or use an access token'), tokenForm))
      : h('div', {}, h('p', {}, 'Sign in once with a GitHub access token — it stays on this device.'), tokenForm),
  );
}

async function statusCard() {
  const card = h('section', { class: 'card' }, h('h2', {}, 'Site'), h('p', { class: 'muted' }, 'Checking…'));
  commitsFor('', 1).then(async ([last]) => {
    const run = last && await runFor(last.sha).catch(() => null);
    const failed = run?.status === 'completed' && run.conclusion !== 'success';
    card.replaceChildren(h('h2', {}, 'Site'),
      last ? h('p', { class: failed ? 'status bad' : 'status good' }, failed ? '● Last publish failed' : run && run.status !== 'completed' ? '◌ Building…' : '● Live') : null,
      last ? h('p', { class: 'muted' }, `Last change ${timeAgo(last.date)}`) : null,
      h('p', {}, h('a', { href: siteInfo?.site.url || '/', target: '_blank', rel: 'noopener' }, 'Open your site ↗')));
  }).catch((error) => card.replaceChildren(h('h2', {}, 'Site'), h('p', { class: 'muted' }, error.message)));
  return card;
}

const checklistState = {
  get() { try { return JSON.parse(localStorage.getItem('plain.checklist')) || {}; } catch { return {}; } },
  set(patch) { localStorage.setItem('plain.checklist', JSON.stringify({ ...this.get(), ...patch })); },
};

async function checklistCard() {
  const state = checklistState.get();
  if (state.dismissed) return null;
  const allItems = [];
  for (const name of Object.keys(siteInfo.collections)) allItems.push(...await collectionIndex(name));
  const main = Object.keys(siteInfo.collections).find((n) => siteInfo.collections[n].listUrl) || Object.keys(siteInfo.collections)[0];
  const steps = [
    { label: 'Name your site', done: siteInfo.site.title !== 'My Site', href: '#/settings' },
    { label: 'Publish your first post', done: allItems.some((i) => !i.example), href: `#/new/${main}` },
    { label: 'Set up your menu', done: Boolean(state.menu), href: '#/navigation' },
    { label: 'Replace the example content', done: allItems.length > 0 && allItems.every((i) => !i.example), href: `#/collection/${main}` },
    { label: 'Connect a custom domain', done: Boolean(state.domain), href: 'https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site', manual: 'domain' },
  ];
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;
  return h('section', { class: 'card checklist' },
    h('h2', {}, `Getting started — ${done} of ${steps.length}`),
    h('ul', {}, steps.map((step) => h('li', { class: step.done ? 'done' : '' },
      h('a', { href: step.href, target: step.href.startsWith('http') ? '_blank' : null }, step.done ? '✓ ' : '○ ', step.label),
      step.manual && !step.done ? h('button', { class: 'linklike', onclick: (e) => { checklistState.set({ [step.manual]: true }); e.target.closest('li').classList.add('done'); } }, 'mark done') : null))),
    h('button', { class: 'linklike muted', onclick: (e) => { checklistState.set({ dismissed: true }); e.target.closest('.card').remove(); } }, 'Dismiss'),
  );
}

async function collectionCard(name, def) {
  const published = await collectionIndex(name);
  const files = await listDir(def.path);
  const publishedSlugs = new Set(published.map((i) => i.slug));
  const drafts = files.filter((f) => f.name.endsWith('.md') && !publishedSlugs.has(f.name.slice(0, -3)));
  const recent = published.slice(0, 3);
  return h('section', { class: 'card' },
    h('h2', {}, def.label),
    h('p', { class: 'muted' }, `${published.length} published${drafts.length ? `, ${drafts.length} draft${drafts.length > 1 ? 's' : ''}` : ''}`),
    recent.length
      ? h('ul', { class: 'recent' }, recent.map((item) => h('li', {}, h('a', { href: `#/edit/${name}/${item.slug}` }, item.title || item.slug))))
      : h('p', { class: 'empty' }, `No ${def.label.toLowerCase()} yet. Your first one takes about two minutes.`),
    h('div', { class: 'card-actions' },
      h('a', { class: 'button primary', href: `#/new/${name}` }, `New ${singular(name)}`),
      h('a', { class: 'button', href: `#/collection/${name}` }, 'View all')),
  );
}

// Update banner (§14.5): compare our engine.json to upstream's raw file; if
// upstream is newer, offer to trigger the update.yml workflow (which opens a PR).
const UPSTREAM_ENGINE = 'https://raw.githubusercontent.com/plain-cms/plain/main/engine.json';
async function updateCard() {
  const [here, there] = await Promise.all([
    getFile('engine.json').then((f) => JSON.parse(f.text)).catch(() => null),
    fetch(UPSTREAM_ENGINE).then((r) => (r.ok ? r.json() : null)).catch(() => null),
  ]);
  if (!here || !there || cmpVersion(there.version, here.version) <= 0) return null;
  return h('section', { class: 'card update' },
    h('h2', {}, `Update available — v${there.version}`),
    h('p', { class: 'muted' }, `You’re on v${here.version}. The update arrives as a pull request you can review, merge to apply, or revert to undo.`),
    h('button', { class: 'primary', onclick: async (e) => {
      e.target.disabled = true;
      try { await dispatchWorkflow('update.yml'); toast('Preparing your update — a pull request will appear in a minute or two.', 'success'); }
      catch (error) { toast(error.message, 'error'); e.target.disabled = false; }
    } }, 'Prepare update'));
}

async function dashboardScreen() {
  const cards = [await statusCard(), await updateCard(), await checklistCard()];
  for (const [name, def] of Object.entries(siteInfo.collections)) cards.push(await collectionCard(name, def));
  return shell('dashboard',
    h('header', { class: 'screen-head' }, h('h1', {}, 'Dashboard')),
    h('div', { class: 'cards' }, cards.filter(Boolean)));
}

async function collectionScreen(name) {
  const def = siteInfo.collections[name];
  if (!def) throw new Error(`Unknown collection "${name}".`);
  const published = await collectionIndex(name);
  const byslug = new Map(published.map((i) => [i.slug, i]));
  const files = (await listDir(def.path)).filter((f) => f.name.endsWith('.md'));
  const rows = files.map((file) => {
    const slug = file.name.slice(0, -3);
    const item = byslug.get(slug);
    return h('a', { class: 'row', href: `#/edit/${name}/${slug}` },
      h('span', { class: 'row-title' }, item?.title || slug, item?.example ? h('span', { class: 'badge' }, 'Example') : null, item ? null : h('span', { class: 'badge draft' }, 'Draft')),
      h('span', { class: 'muted' }, item?.date || ''));
  });
  rows.sort((a, b) => (a.lastChild.textContent < b.lastChild.textContent ? 1 : -1)); // newest first
  return shell(`collection:${name}`,
    h('header', { class: 'screen-head' },
      h('h1', {}, def.label),
      h('a', { class: 'button primary', href: `#/new/${name}` }, `New ${singular(name)}`)),
    rows.length ? h('div', { class: 'rows' }, rows)
      : h('p', { class: 'empty big' }, `No ${def.label.toLowerCase()} yet. Your first one takes about two minutes. `,
          h('a', { href: `#/new/${name}` }, `Write the first ${singular(name)}`)));
}

async function navigationScreen() {
  let sha = null;
  let entries = siteInfo?.navigation || [];
  try { const file = await getFile('data/navigation.json'); entries = JSON.parse(file.text); sha = file.sha; } catch { /* file may not exist yet — start empty */ }

  const list = h('div', { class: 'nav-rows' });
  const rowFor = (entry) => {
    const row = h('div', { class: 'nav-row' },
      h('input', { type: 'text', value: entry.label, placeholder: 'Label' }),
      h('input', { type: 'text', value: entry.url, placeholder: '/page/' }),
      h('button', { title: 'Move up', onclick: () => row.previousElementSibling?.before(row) }, '↑'),
      h('button', { title: 'Move down', onclick: () => row.nextElementSibling?.after(row) }, '↓'),
      h('button', { title: 'Remove', onclick: () => row.remove() }, '✕'));
    return row;
  };
  entries.forEach((entry) => list.append(rowFor(entry)));

  async function save() {
    const next = [...list.children].map((row) => ({ label: row.children[0].value.trim(), url: row.children[1].value.trim() }))
      .filter((e) => e.label && e.url);
    try {
      const { commitSha } = await putFile('data/navigation.json', JSON.stringify(next, null, 2) + '\n', 'navigation: update menu', sha);
      checklistState.set({ menu: true });
      toast('Menu saved — publishing now.', 'success');
      watchBuild(commitSha, siteInfo?.site.url);
      route();
    } catch (error) { toast(error.message, 'error'); }
  }

  return shell('navigation',
    h('header', { class: 'screen-head' }, h('h1', {}, 'Navigation'),
      h('button', { class: 'primary', onclick: save }, 'Publish menu')),
    h('p', { class: 'muted' }, 'The links in your site’s header, in order.'),
    list,
    h('button', { onclick: () => list.append(rowFor({ label: '', url: '' })) }, '+ Add link'));
}

async function settingsScreen() {
  const { text, sha } = await getFile('site.config.json');
  const config = JSON.parse(text);
  const themes = (await listDir('themes')).filter((e) => e.type === 'dir').map((e) => e.name);
  const field = (label, input) => h('label', { class: 'field' }, label, input);
  const title = h('input', { type: 'text', value: config.site.title });
  const description = h('input', { type: 'text', value: config.site.description || '' });
  const url = h('input', { type: 'text', value: config.site.url });
  const language = h('input', { type: 'text', value: config.site.language || 'en' });
  const theme = h('select', {}, themes.map((name) => h('option', { value: name, selected: name === config.site.theme ? '' : null }, name)));
  const footerFile = await getFile('data/footer.json').catch(() => ({ text: '{}', sha: undefined })); // may not exist yet
  const footer = h('input', { type: 'text', value: JSON.parse(footerFile.text).html || '', placeholder: 'Powered by <a href="…">…</a>' });

  const aiKey = h('input', { type: 'password', value: aiSettings.key, placeholder: 'sk-ant-…', autocomplete: 'off' });
  const aiModel = h('select', {}, ['claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4-5'].map((id) => h('option', { value: id, selected: id === aiSettings.model ? '' : null }, id)));

  async function save() {
    aiSettings.key = aiKey.value.trim();      // stays on this device — never committed
    aiSettings.model = aiModel.value;
    Object.assign(config.site, { title: title.value.trim(), description: description.value.trim(),
      url: url.value.trim().replace(/\/$/, ''), language: language.value.trim() || 'en', theme: theme.value });
    try {
      if (footer.value.trim() !== (JSON.parse(footerFile.text).html || '')) await putFile('data/footer.json', JSON.stringify({ html: footer.value.trim() }, null, 2) + '\n', 'settings: update footer', footerFile.sha);
      const { commitSha } = await putFile('site.config.json', JSON.stringify(config, null, 2) + '\n', 'settings: update site settings', sha);
      toast('Settings saved — publishing now.', 'success');
      watchBuild(commitSha, config.site.url);
    } catch (error) { toast(error.message, 'error'); }
  }

  return shell('settings',
    h('header', { class: 'screen-head' }, h('h1', {}, 'Settings'),
      h('button', { class: 'primary', onclick: save }, 'Save & publish')),
    h('div', { class: 'form' },
      field('Site title', title),
      field('One-line description', description),
      field('Site address (URL)', url),
      field('Language code', language),
      field('Theme', theme),
      field('Footer note (HTML, shown on every page)', footer)),
    h('hr'),
    h('h2', {}, 'AI assist'),
    h('p', { class: 'muted' }, 'Optional. Paste an Anthropic API key to enable the ✨ buttons in the editor. The key stays in this browser and is sent only to Anthropic.'),
    h('div', { class: 'form' },
      field('Anthropic API key', aiKey),
      field('Model', aiModel)),
    h('hr'),
    h('p', { class: 'muted' }, `Signed in to ${auth.repo}. `,
      h('button', { class: 'linklike', onclick: signOut }, 'Sign out')));
}

const routes = {
  '': dashboardScreen,
  collection: (name) => collectionScreen(name),
  edit: (name, slug) => editorScreen({ siteInfo, collection: name, slug, onSaved: () => indexCache.delete(name) }),
  new: (name) => editorScreen({ siteInfo, collection: name, slug: null, onSaved: () => indexCache.delete(name) }),
  media: async () => shell('media', await mediaScreen()),
  navigation: navigationScreen,
  appearance: async () => shell('appearance', await appearanceScreen(siteInfo)),
  settings: settingsScreen,
  welcome: () => wizardScreen(siteInfo, () => { location.hash = '#/'; route(); }),
};

async function route() {
  if (!auth.signedIn) return show(signinScreen());
  const [head, ...rest] = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  const screen = routes[head || ''];
  if (!screen) { location.hash = '#/'; return; }
  show(h('p', { class: 'loading' }, 'Loading…'));
  try {
    show(await screen(...rest));
  } catch (error) {
    show(shell('', h('div', { class: 'error-screen' },
      h('h1', {}, 'Something went wrong'),
      h('p', {}, error.message),
      h('button', { onclick: route }, 'Try again'))));
  }
}

async function boot() {
  siteInfo = await fetch('../api/site.json').then((r) => (r.ok ? r.json() : null)).catch(() => null);
  if (!siteInfo) {
    return show(h('div', { class: 'error-screen' }, h('h1', {}, 'The site hasn’t been built yet'),
      h('p', {}, 'The admin reads your site’s published data (api/site.json), which isn’t there yet. Once the first build finishes, reload this page.')));
  }
  // First run (§8.5): the template placeholder title means a fresh install.
  if (auth.signedIn && siteInfo.site.title === 'My Site' && !localStorage.getItem('plain.wizard')) {
    location.hash = '#/welcome';
  }
  window.addEventListener('hashchange', route);
  route();
}

boot();
