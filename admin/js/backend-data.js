// admin/js/backend-data.js — owner-only views of data your backend collects:
// Feedback (GET /feedback, from the feedback widget) and Insights (GET /reports,
// from sales-analytics tracking). Both authenticate to the backend with your GitHub
// sign-in by default (backends in GitHub mode — Admin:Repo); a pasted admin token
// is the fallback for static-token backends. Either is sent only to your backend.

import { h } from './ui.js';
import { auth } from './github.js';

const TOKEN_KEY = 'plain.backend.token';   // fallback static token for backends not in GitHub mode
const num = (n) => Number(n || 0).toLocaleString('en-US');
const pct = (a, b) => `${b ? Math.round((a / b) * 1000) / 10 : 0}%`;
const when = (s) => { const d = new Date(s); return isNaN(d) ? String(s || '') : d.toLocaleString(); };

// Resolve services.backend, fetch `path` with your GitHub token (or a pasted fallback token),
// prompting on 401/403, and hand the parsed JSON to render(). h() sets strings as textContent,
// so backend data is inert in the DOM — no escaping needed.
function dataScreen(siteInfo, { title, path, hint, render }) {
  const api = (siteInfo.services || {}).backend || '';
  const body = h('div', { class: 'data-view' });
  const screen = h('div', {},
    h('header', { class: 'screen-head' }, h('h1', {}, title)),
    h('div', { class: 'cards' }, h('section', { class: 'card' }, body)));
  if (!api) {
    body.append(h('p', { class: 'muted' }, 'No backend connected. Connect one on the ', h('a', { href: '#/backend' }, 'Backend'), ' screen first — that’s where this data comes from.'));
    return screen;
  }
  const bar = () => h('p', { class: 'update-actions' },
    h('button', { onclick: load }, 'Refresh'),
    h('button', { class: 'linklike', onclick: () => { forget(); askToken(); } }, 'Change token'));
  const forget = () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* private mode */ } };
  function askToken() {
    const input = h('input', { type: 'password', placeholder: 'backend admin token', autocomplete: 'off' });
    body.replaceChildren(h('form', { class: 'data-auth', onsubmit: (event) => {
      event.preventDefault();
      const value = input.value.trim(); if (!value) return;
      try { localStorage.setItem(TOKEN_KEY, value); } catch { /* private mode */ }
      load();
    } }, h('p', { class: 'muted' }, hint), h('label', {}, 'Backend admin token', input), h('button', { class: 'primary' }, 'View')));
  }
  async function load() {
    body.replaceChildren(h('p', { class: 'muted' }, 'Loading…'));
    // Prefer a manually-pasted token (static-token backends); else the GitHub login token.
    let token = auth.token; try { token = localStorage.getItem(TOKEN_KEY) || auth.token; } catch { /* private mode */ }
    try {
      const res = await fetch(`${api}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (res.status === 401 || res.status === 403) return askToken();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      body.replaceChildren(bar(), render(await res.json()));
    } catch (error) {
      body.replaceChildren(bar(), h('p', { class: 'muted' }, `Couldn’t reach your backend (${error.message}). Check the URL and its CORS.`));
    }
  }
  load();
  return screen;
}

export function feedbackScreen(siteInfo) {
  return dataScreen(siteInfo, {
    title: 'Feedback', path: '/feedback?limit=200',
    hint: 'By default this uses your GitHub sign-in. If it wasn’t accepted, you either lack push access to this repo or the backend uses its own admin token — paste that below.',
    render: (data) => {
      const items = Array.isArray(data.items) ? data.items : [];
      if (!items.length) return h('p', { class: 'muted' }, 'No feedback yet. Messages sent from the widget will appear here.');
      return h('div', { class: 'feedback-list' }, items.map((it) => h('article', { class: 'feedback-item' },
        h('p', { class: 'feedback-msg' }, it.message || ''),
        h('p', { class: 'feedback-meta' }, [it.email, it.page, when(it.createdAt)].filter(Boolean).join(' · ')))));
    },
  });
}

export function insightsScreen(siteInfo) {
  return dataScreen(siteInfo, {
    title: 'Insights', path: '/reports',
    hint: 'By default this uses your GitHub sign-in. If it wasn’t accepted, you either lack push access to this repo or the backend uses its own admin token — paste that below.',
    render: (data) => {
      const pages = (Array.isArray(data.pages) ? data.pages : []).slice().sort((a, b) => (b.views || 0) - (a.views || 0));
      const views = pages.reduce((n, p) => n + (p.views || 0), 0);
      const clicks = pages.reduce((n, p) => n + (p.clicks || 0), 0);
      const tile = (label, value) => h('div', { class: 'stat' }, h('div', { class: 'stat-value' }, value), h('div', { class: 'stat-label' }, label));
      const rows = pages.map((p) => h('tr', {},
        h('td', {}, p.page || ''), h('td', { class: 'num' }, num(p.views)), h('td', { class: 'num' }, num(p.clicks)),
        h('td', { class: 'num' }, pct(p.clicks, p.views)), h('td', {}, (p.ctas || []).map((x) => `${x.cta} ${num(x.clicks)}`).join(', '))));
      return h('div', {},
        h('div', { class: 'stats' }, tile('Views', num(views)), tile('CTA clicks', num(clicks)), tile('Click-through', pct(clicks, views))),
        h('table', { class: 'data-table' },
          h('thead', {}, h('tr', {}, h('th', {}, 'Page'), h('th', { class: 'num' }, 'Views'), h('th', { class: 'num' }, 'Clicks'), h('th', { class: 'num' }, 'CTR'), h('th', {}, 'By CTA'))),
          h('tbody', {}, rows.length ? rows : h('tr', {}, h('td', { class: 'muted', colspan: '5' }, 'No events recorded yet.')))));
    },
  });
}
