// admin/js/ui.js — small DOM helpers shared by every admin screen.
// No framework: h() builds elements, and a few widgets (toast, dialog,
// build-status pill) cover everything the screens need.

import { runFor } from './github.js';

/**
 * Build a DOM element: h('button', {class: 'primary', onclick}, 'Save').
 * Props starting with "on" become listeners; children may be strings,
 * nodes, arrays, or null/undefined (skipped).
 */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value == null) continue;
    if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else el.setAttribute(key, value);
  }
  el.append(...[children].flat(Infinity).filter((c) => c != null));
  return el;
}

/** Replace #app's content with the given element(s). */
export function show(...elements) { document.getElementById('app').replaceChildren(...elements); }

/** "2026-07-05T10:00:00Z" → "2 hours ago" / "3 days ago". */
export function timeAgo(iso) {
  let value = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000), unit = 'second';
  for (const [size, name] of [[60, 'minute'], [60, 'hour'], [24, 'day'], [7, 'week'], [4.35, 'month'], [12, 'year']]) {
    if (value < size) break;
    value /= size;
    unit = name;
  }
  const n = Math.floor(value);
  return n <= 0 ? 'just now' : `${n} ${unit}${n > 1 ? 's' : ''} ago`;
}

/** Transient message, bottom center. type: 'info' | 'error' | 'success'. */
export function toast(message, type = 'info') {
  const el = h('div', { class: `toast toast-${type}`, role: 'status' }, message);
  document.body.append(el);
  setTimeout(() => el.classList.add('visible'), 10);
  setTimeout(() => { el.classList.remove('visible'); setTimeout(() => el.remove(), 300); }, type === 'error' ? 8000 : 4000);
}

/**
 * Modal scaffold shared by every dialog: build(done) returns the children;
 * calling done(value) closes and resolves; Escape resolves null.
 */
export function modal(className, build) {
  return new Promise((resolve) => {
    const done = (value) => { dialog.returnValue = 'x'; dialog.close(); resolve(value); };
    const dialog = h('dialog', { class: className }, build(done));
    dialog.addEventListener('close', () => { dialog.remove(); if (!dialog.returnValue) resolve(null); });
    document.body.append(dialog);
    dialog.showModal();
  });
}

/** Question with buttons. actions: [{label, value, kind}]. Resolves the chosen value. */
export const ask = ({ title, message, actions }) => modal('ask', (done) => [
  h('h2', {}, title),
  message ? h('p', {}, message) : null,
  h('div', { class: 'ask-actions' }, actions.map((action) => h('button', { class: action.kind || '', onclick: () => done(action.value) }, action.label))),
]);

/**
 * One-line text prompt. Resolves with the string or null.
 * Optional suggest: {label, run} adds a button that fills the input (AI assist).
 */
export function askText({ title, message, placeholder = '', value = '', suggest = null }) {
  const input = h('input', { type: 'text', placeholder, value });
  setTimeout(() => input.focus());
  return modal('ask', (done) => {
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') done(input.value); });
    return [
      h('h2', {}, title),
      message ? h('p', {}, message) : null,
      input,
      h('div', { class: 'ask-actions' },
        suggest ? h('button', { onclick: async (e) => {
          e.target.disabled = true;
          try { input.value = await suggest.run(); } catch (error) { toast(error.message, 'error'); }
          e.target.disabled = false;
        } }, suggest.label) : null,
        h('button', { onclick: () => done(null) }, 'Cancel'),
        h('button', { class: 'primary', onclick: () => done(input.value) }, 'OK')),
    ];
  });
}

// --- build-status pill --------------------------------------------------------
// After a publish, poll the Actions API and narrate: Building… → Live ✓.
// Never says "commit", "push" or any other Git word (cms-spec.md §8.2).

let pillEl = null;
let pollTimer = null;

function setPill(className, ...children) {
  if (!pillEl) { pillEl = h('div', { class: 'pill' }); document.body.append(pillEl); }
  pillEl.className = `pill visible ${className}`;
  pillEl.replaceChildren(...children);
}

export function hidePill() { clearTimeout(pollTimer); pillEl?.classList.remove('visible'); }

/** Watch the build for a commit and keep the pill in sync. */
export function watchBuild(commitSha, siteUrl) {
  clearTimeout(pollTimer);
  setPill('building', h('span', { class: 'dot' }), 'Saving…');
  const startedAt = Date.now();
  const poll = async () => {
    let run = null;
    try { run = await runFor(commitSha); } catch { /* transient network error — keep polling */ }
    if (run?.status === 'completed') {
      if (run.conclusion === 'success') {
        setPill('live', '✓ Live — ', h('a', { href: siteUrl || '/', target: '_blank', rel: 'noopener' }, 'view site'));
        pollTimer = setTimeout(hidePill, 15000);
      } else {
        setPill('failed', 'Publishing hit a snag — ', h('a', { href: run.html_url, target: '_blank', rel: 'noopener' }, 'see details'));
      }
      return;
    }
    if (run) setPill('building', h('span', { class: 'dot' }), 'Building your site…');
    if (Date.now() - startedAt > 5 * 60 * 1000) { hidePill(); return; } // give up quietly after 5 min
    pollTimer = setTimeout(poll, 5000);
  };
  pollTimer = setTimeout(poll, 3000);
}
