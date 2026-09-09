// admin/js/app.js — screens and routing for the admin.
// A single-page vanilla app. Reads the published static API for schema and
// content metadata; writes through the GitHub API (see github.js).
// UI language rule: never "commit/push/branch" — always "save/publish/history".

import { auth, inDemo, repoInfo, getFile, updateFile, listDir, commitsFor, runFor, dispatchWorkflow, updatePull, mergePull, cmpVersion } from './github.js';
import { h, show, toast, timeAgo, watchBuild, ask } from './ui.js';
import { editorScreen } from './editor.js';
import { mediaScreen } from './media.js';
import { aiSettings } from './ai.js';
import { appearanceScreen } from './appearance.js';
import { pluginsScreen, pluginUpdatesCard } from './plugins.js';
import { backendScreen } from './backend.js';
import { dataScreen, apiFetch } from './backend-data.js';
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

/**
 * Start (or resume) the demo: seed the in-browser repository and raise the
 * standing "this is a demo" strip. Loaded on demand — a signed-in site never
 * fetches demo.js at all.
 */
async function enterDemo() {
  const { demo, mountBanner } = await import('./demo.js');
  await (demo.active ? demo.resume(siteInfo) : demo.enter(siteInfo));
  mountBanner({
    onReset: async () => { await demo.reset(siteInfo); indexCache.clear(); location.hash = '#/'; route(); toast('Back to the published site — your demo edits are gone.', 'success'); },
    onExit: () => { demo.exit(); indexCache.clear(); route(); },
  });
}

/** Confirm, then clear the stored credentials and return to the sign-in screen. */
async function signOut() {
  if (inDemo()) { (await import('./demo.js')).demo.exit(); indexCache.clear(); return route(); }
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
      link('#/plugins', 'Plugins', 'plugins'),
      link('#/backend', 'Backend', 'backend'),
      (siteInfo?.adminScreens || []).map((s) => link(`#/${s.id}`, s.label, s.id)),
      link('#/settings', 'Settings', 'settings'),
      h('div', { class: 'sidebar-foot' },
        h('a', { href: siteInfo?.site.url || '/', target: '_blank', rel: 'noopener' }, 'View site ↗'),
        h('button', { class: 'linklike signout', onclick: signOut }, inDemo() ? 'Exit demo' : `Sign out${auth.repo ? ` (${auth.repo})` : ''}`)),
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

  // A site with "demo": true offers the whole editor with no account at all
  // (§8.6) — the first thing a visitor should be able to do is try it.
  const demoButton = siteInfo?.site.demo ? h('div', { class: 'demo-offer' },
    h('button', { class: 'primary', onclick: async (event) => {
      event.target.disabled = true;
      event.target.textContent = 'Setting up your demo…';
      try { await enterDemo(); location.hash = '#/'; route(); }
      catch (error) { event.target.disabled = false; event.target.textContent = 'Try the editor'; toast(error.message, 'error'); }
    } }, 'Try the editor'),
    h('p', { class: 'muted' }, 'No account, no sign-up. You get a copy of this site in your browser: write, publish, browse the history. Nothing you do here is saved anywhere.')) : null;

  return h('div', { class: 'signin' },
    // "Welcome back" is right for the site's own writers; a first-time visitor
    // (nobody has signed in on this device) is more likely here to look around.
    h('h1', {}, auth.repo ? 'Welcome back' : siteInfo?.site.title || 'Welcome'),
    demoButton,
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

  const actions = h('p', { class: 'update-actions' });
  const card = h('section', { class: 'card update' },
    h('h2', {}, `Update available — v${there.version}`),
    h('p', { class: 'muted' }, `You’re on v${here.version}. The update arrives as a pull request you can review, merge to apply, or revert to undo.`),
    actions);

  // Once the update.yml workflow has opened the PR, offer to finish it in one
  // click when it's conflict-free — no trip to GitHub. Otherwise send them to review it.
  const paint = async () => {
    const pr = await updatePull().catch(() => null);
    actions.replaceChildren();
    if (!pr) {
      actions.append(h('button', { class: 'primary', onclick: async (e) => {
        e.target.disabled = true;
        try { await dispatchWorkflow('update.yml'); toast('Preparing your update — the pull request appears in a minute or two.', 'success'); poll(); }
        catch (error) { toast(error.message, 'error'); e.target.disabled = false; }
      } }, 'Prepare update'));
      return null;
    }
    const flagged = Number((pr.body?.match(/needs manual or AI merge \((\d+)\)/) || [])[1] ?? 0);
    actions.append(h('a', { href: pr.html_url, target: '_blank', rel: 'noopener' }, 'Review the update'));
    if (pr.mergeable !== false && flagged === 0) {
      actions.append(h('button', { class: 'primary', onclick: async (e) => {
        e.target.disabled = true; e.target.textContent = 'Upgrading…';
        try { await mergePull(pr.number); toast('Upgrade complete — your site is rebuilding on the new version.', 'success'); card.remove(); }
        catch (error) { toast(`Couldn’t merge automatically — open the update to finish it. (${error.message})`, 'error'); e.target.disabled = false; e.target.textContent = 'Complete upgrade now'; }
      } }, 'Complete upgrade now'));
    } else {
      actions.append(h('span', { class: 'muted' }, flagged ? ` — it changes ${flagged} file${flagged > 1 ? 's' : ''} you’ve edited; review before merging.` : ' — review before merging.'));
    }
    return pr;
  };
  let tries = 0;
  const poll = () => { if (++tries <= 10) setTimeout(async () => { if (!await paint()) poll(); }, 12000); };

  await paint();
  return card;
}

async function dashboardScreen() {
  const cards = [await statusCard(), await updateCard(), await pluginUpdatesCard(), await checklistCard()];
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
  let entries = siteInfo?.navigation || [];
  try { const file = await getFile('data/navigation.json'); entries = JSON.parse(file.text); } catch { /* file may not exist yet — start empty */ }

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
      const { commitSha } = await updateFile('data/navigation.json', () => JSON.stringify(next, null, 2) + '\n', 'navigation: update menu');
      checklistState.set({ menu: true });
      toast('Menu saved — publishing now.', 'success');
      if (commitSha) watchBuild(commitSha, siteInfo?.site.url);
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
  const { text } = await getFile('site.config.json');
  const config = JSON.parse(text);
  const themes = (await listDir('themes')).filter((e) => e.type === 'dir').map((e) => e.name);
  const field = (label, input) => h('label', { class: 'field' }, label, input);
  const title = h('input', { type: 'text', value: config.site.title });
  const description = h('input', { type: 'text', value: config.site.description || '' });
  const url = h('input', { type: 'text', value: config.site.url });
  const language = h('input', { type: 'text', value: config.site.language || 'en' });
  const languages = h('input', { type: 'text', value: (config.site.languages || []).filter((l) => l !== (config.site.language || 'en')).join(' '), placeholder: 'de fr' });
  const theme = h('select', {}, themes.map((name) => h('option', { value: name, selected: name === config.site.theme ? '' : null }, name)));
  const footerFile = await getFile('data/footer.json').catch(() => ({ text: '{}', sha: undefined })); // may not exist yet
  const footer = h('input', { type: 'text', value: JSON.parse(footerFile.text).html || '', placeholder: 'Powered by <a href="…">…</a>' });

  const aiKey = h('input', { type: 'password', value: aiSettings.key, placeholder: 'sk-ant-…', autocomplete: 'off' });
  const aiModel = h('select', {}, ['claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4-5'].map((id) => h('option', { value: id, selected: id === aiSettings.model ? '' : null }, id)));

  async function save() {
    aiSettings.key = aiKey.value.trim();      // stays on this device — never committed
    aiSettings.model = aiModel.value;
    const defaultLang = language.value.trim() || 'en';
    const extra = [...new Set(languages.value.trim().split(/[\s,]+/).map((c) => c.toLowerCase()).filter(Boolean))].filter((c) => c !== defaultLang);
    const siteUrl = url.value.trim().replace(/\/$/, '');
    const wantedFooter = footer.value.trim();
    try {
      // Re-read + re-apply on each write, so enabling a plugin (or any other edit)
      // between opening Settings and saving is preserved here, never clobbered.
      const foot = await updateFile('data/footer.json', (text) =>
        wantedFooter === (JSON.parse(text || '{}').html || '') ? text : JSON.stringify({ html: wantedFooter }, null, 2) + '\n',
        'settings: update footer');
      const { commitSha } = await updateFile('site.config.json', (text) => {
        const cfg = JSON.parse(text);
        Object.assign(cfg.site, { title: title.value.trim(), description: description.value.trim(),
          url: siteUrl, language: defaultLang, theme: theme.value,
          languages: extra.length ? [defaultLang, ...extra] : [] });
        return JSON.stringify(cfg, null, 2) + '\n';
      }, 'settings: update site settings');
      toast('Settings saved — publishing now.', 'success');
      const built = commitSha || foot.commitSha;
      if (built) watchBuild(built, siteUrl);
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
      field('Additional languages', languages),
      field('Theme', theme),
      field('Footer note (HTML, shown on every page)', footer)),
    h('p', { class: 'muted' }, 'Add “Additional languages” (codes like de fr) to make the site multilingual: translations live in sibling files (about.de.md), the editor’s Translate button writes them, and the language-switcher plugin shows a footer switcher.'),
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
  plugins: async () => shell('plugins', await pluginsScreen(siteInfo)),
  backend: async () => shell('backend', await backendScreen(siteInfo)),
  settings: settingsScreen,
  welcome: () => wizardScreen(siteInfo, () => { location.hash = '#/'; route(); }),
};

/**
 * Open a screen contributed by a plugin (§9 admin surface).
 *
 * The plugin's module is imported only when its screen is first opened, and is
 * handed a context rather than importing from `admin/` — so a plugin never
 * depends on where the admin's files live, and never receives the GitHub token
 * directly. `dataScreen` uses it on the plugin's behalf.
 */
async function pluginScreen(entry) {
  const module = await import(entry.module);
  const screen = module.default?.screens?.[entry.id];
  if (typeof screen !== 'function') {
    throw new Error(`The "${entry.plugin}" plugin declares the "${entry.id}" screen but its module doesn't export one.`);
  }
  return shell(entry.id, await screen({
    h,
    siteInfo,
    dataScreen: (spec) => dataScreen(siteInfo, spec),
    apiFetch: (path, init) => apiFetch(siteInfo, path, init),
    options: (siteInfo?.pluginOptions || {})[entry.plugin] || {},
  }));
}

async function route() {
  if (!auth.signedIn) return show(signinScreen());
  const [head, ...rest] = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  const screen = routes[head || ''];
  const plugin = screen ? null : (siteInfo?.adminScreens || []).find((s) => s.id === head);
  if (!screen && !plugin) { location.hash = '#/'; return; }
  show(h('p', { class: 'loading' }, 'Loading…'));
  try {
    show(plugin ? await pluginScreen(plugin) : await screen(...rest));
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
  // "Try the editor" (§8.6): ?demo=1 drops a visitor straight in — that is the
  // link to hand out — and a demo already running survives a reload of the tab.
  if (siteInfo.site.demo && (new URLSearchParams(location.search).has('demo') || inDemo())) await enterDemo().catch(() => {});
  // First run (§8.5): the template placeholder title means a fresh install.
  if (auth.signedIn && !inDemo() && siteInfo.site.title === 'My Site' && !localStorage.getItem('plain.wizard')) {
    location.hash = '#/welcome';
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('plain:signed-out', route); // gh() fires this on a 401 (dead token) → back to sign-in
  route();
}

boot();
