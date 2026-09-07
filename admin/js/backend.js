// admin/js/backend.js — the "Backend" screen (cms-spec.md §8). Some plugins
// (analytics, contact, feedback) send data to a small backend; this screen
// connects one: a one-click "create from template" link, a health check, and
// a field that writes services.backend into site.config.json.

import { updateFile, auth } from './github.js';
import { h, toast, watchBuild } from './ui.js';

// Enabled plugins that talk to services.backend, and what each uses it for.
const CONSUMERS = {
  'sales-analytics': 'views + CTA clicks (POST /events, GET /reports)',
  'contact-form': 'contact submissions (POST /contact)',
  feedback: 'the feedback widget (POST /feedback)',
  'api-form': 'config-declared forms (POST to your endpoint)',
};

export async function backendScreen(siteInfo) {
  const current = (siteInfo.services || {}).backend || '';
  const consumers = Object.entries(CONSUMERS).filter(([id]) => (siteInfo.plugins || []).includes(id));

  // "Create backend repo" is a link to GitHub's create-from-template page, not a contents-API
  // call: it runs under the writer's own GitHub session, so it works even when the admin token
  // can't create repos (fine-grained / OAuth-app tokens → "Resource not accessible by integration").
  const [owner, repoName = 'site'] = (auth.repo || '/').split('/');
  const genUrl = `https://github.com/plain-cms/backend/generate?owner=${owner}&name=${encodeURIComponent(repoName + '-backend')}&description=${encodeURIComponent(`Backend for ${repoName} (plain CMS)`)}`;
  const create = h('a', { class: 'button primary', href: genUrl, target: '_blank', rel: 'noopener' }, 'Create backend repo →');

  const health = h('span', { class: 'muted' });
  const check = h('button', { onclick: async () => {
    health.textContent = ' checking…';
    try { const r = await fetch(`${current}/health`); health.textContent = r.ok ? ' ✓ healthy' : ` ✗ HTTP ${r.status}`; }
    catch { health.textContent = ' ✗ unreachable (check the URL and its CORS)'; }
  } }, 'Check health');

  const url = h('input', { type: 'url', value: current, placeholder: 'https://api.example.com' });
  const save = h('button', { class: 'primary', onclick: async () => {
    const value = url.value.trim().replace(/\/+$/, '');
    if (value && !/^https:\/\/\S+$/.test(value)) return toast('Use a full https:// URL — an endpoint only, never a secret.', 'error');
    try {
      const result = await updateFile('site.config.json', (text) => {
        const config = JSON.parse(text);
        config.services = { ...(config.services || {}) };
        if (value) config.services.backend = value; else delete config.services.backend;
        return JSON.stringify(config, null, 2) + '\n';
      }, value ? 'settings: connect backend' : 'settings: remove backend');
      toast(value ? 'Backend connected — your site is rebuilding.' : 'Backend removed.', 'success');
      watchBuild(result.commitSha, siteInfo.site.url);
    } catch (error) { toast(error.message, 'error'); }
  } }, 'Save');

  return h('div', {},
    h('header', { class: 'screen-head' }, h('h1', {}, 'Backend')),
    h('div', { class: 'cards' },
      h('section', { class: 'card' },
        h('h2', {}, 'Status'),
        current
          ? h('p', {}, 'Connected: ', h('code', {}, current), ' ', check, health)
          : h('p', { class: 'muted' }, 'No backend connected. Plugins that need one stay inert until you add it below.')),
      h('section', { class: 'card' },
        h('h2', {}, 'Connect a backend'),
        h('p', { class: 'muted' }, 'Plugins like analytics, contact, and feedback send data to a backend. The button opens GitHub’s “create from template” page for ', h('a', { href: 'https://github.com/plain-cms/backend', target: '_blank', rel: 'noopener' }, 'plain-cms/backend'), ' (.NET or Node, both SQLite, same API) — create it in your account, deploy the dotnet/ or node/ folder, then paste its URL below.'),
        h('p', { class: 'update-actions' }, create),
        h('label', { class: 'field' }, 'Backend URL', url),
        save),
      consumers.length ? h('section', { class: 'card' },
        h('h2', {}, 'Used by'),
        h('ul', {}, consumers.map(([id, use]) => h('li', {}, h('strong', {}, id), ` — ${use}`)))) : null),
  );
}
