// Applications — the inbox for applications sent from job pages.
//
// An admin screen contributed by this plugin (§9 admin surface). Applications
// are stored by the backend (the api-form "apply" form posts there); from here
// the owner reviews each one and forwards it to the job poster, which the
// backend emails through Amazon SES with Reply-To set to the applicant.
//
// Backend contract (options.service + options.apiPath):
//   GET   /?status=&days=        → { items, counts: {new, forwarded, rejected, total}, from }
//   PATCH /<id>                  { status?, notes? } → item
//   POST  /<id>/forward          { to, cc, replyTo, subject, message, notifyApplicant } → { item, warning }
// Calls go through the context's apiFetch, which attaches the sign-in — this
// module never sees a token. Everything renders via textContent, so applicant
// text is inert in the DOM.

const STATUSES = [['new', 'New'], ['forwarded', 'Forwarded'], ['rejected', 'Rejected'], ['all', 'All']];
const RANGES = [[30, 'Last 30 days'], [90, 'Last 90 days'], [365, 'Last year'], [0, 'All time']];
const PREFS_KEY = 'plain.applications.view'; // the remembered filter, per browser

export default {
  screens: {
    applications: (context) => inbox(context),
  },
};

function inbox({ apiFetch, options }) {
  const base = options.apiPath || '/angjobs/applications';
  const service = options.service || 'backend';
  const collection = options.collection || 'jobs';
  let view = { status: 'new', days: 90 };
  try { view = { ...view, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') }; } catch { /* private mode or bad JSON */ }
  let data = { items: [], counts: {}, from: '' };

  injectStyles();
  const root = el('div', { class: 'ja' });

  async function api(path, { method = 'GET', body } = {}) {
    const res = await apiFetch(base + path, {
      service, method,
      headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.error || `The backend answered ${res.status}.`);
    return json;
  }

  const head = (...actions) => el('header', { class: 'screen-head' }, el('h1', {}, 'Applications'), ...actions);

  async function load() {
    root.replaceChildren(head(), el('p', { class: 'loading' }, 'Loading applications…'));
    try {
      data = await api(`/?status=${encodeURIComponent(view.status)}&days=${view.days}`);
      render();
    } catch (error) {
      root.replaceChildren(head(), el('section', { class: 'card ja-notice' },
        el('h2', {}, 'Couldn’t load applications'),
        el('p', {}, error.message),
        el('p', { class: 'muted' }, 'The inbox is for people who can publish to this site’s repository; it reads from the site’s backend.'),
        el('button', { onclick: load }, 'Try again')));
    }
  }

  function setView(patch) {
    view = { ...view, ...patch };
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(view)); } catch { /* private mode */ }
    load();
  }

  function render() {
    const counts = data.counts || {};
    const tabs = el('div', { class: 'ja-tabs', role: 'tablist' }, STATUSES.map(([key, label]) => el('button', {
      role: 'tab', 'aria-selected': String(view.status === key), class: view.status === key ? 'current' : '',
      onclick: () => setView({ status: key }),
    }, label, el('span', { class: 'ja-count' }, String(key === 'all' ? counts.total ?? 0 : counts[key] ?? 0)))));
    const range = el('select', { 'aria-label': 'Time range', onchange: (e) => setView({ days: Number(e.target.value) }) },
      RANGES.map(([days, label]) => el('option', { value: String(days), selected: view.days === days }, label)));
    const items = data.items || [];
    root.replaceChildren(
      head(el('button', { onclick: load }, 'Refresh')),
      el('div', { class: 'ja-toolbar' }, tabs, range),
      items.length
        ? el('div', { class: 'ja-list' }, items.map(card))
        : el('p', { class: 'muted ja-empty' }, view.status === 'new' ? 'Nothing waiting. New applications from job pages land here.' : 'No applications match this view.'),
      data.from ? el('p', { class: 'muted ja-from' }, `Forwards are sent from ${data.from} through Amazon SES.`) : null,
    );
  }

  function card(item) {
    const notes = el('textarea', { class: 'ja-notes', rows: 2, placeholder: 'Private note (only you see this)', value: item.notes || '' });
    notes.addEventListener('change', () => update(item, { notes: notes.value }, 'Note saved'));
    return el('article', { class: `card ja-card ja-${item.status}` },
      el('div', { class: 'ja-top' },
        el('span', { class: `ja-badge ja-badge-${item.status}` }, item.status),
        el('span', { class: 'muted ja-when' }, when(item.createdAt))),
      el('h2', { class: 'ja-job' }, item.jobUrl ? el('a', { href: item.jobUrl, target: '_blank', rel: 'noopener' }, item.jobTitle || item.jobUrl) : item.jobTitle || 'Unknown job'),
      el('p', { class: 'ja-applicant' }, el('strong', {}, item.name), ' · ', el('a', { href: `mailto:${item.email}` }, item.email)),
      item.message
        ? el('details', { class: 'ja-message', open: !item.forwardedAt && item.message.length < 600 }, el('summary', {}, 'Message'), el('p', {}, item.message))
        : el('p', { class: 'muted ja-meta' }, 'No message.'),
      el('p', { class: 'ja-meta muted' },
        item.author ? `Posted by ${item.author}` : 'Original post',
        item.sourceUrl ? [' · ', el('a', { href: item.sourceUrl, target: '_blank', rel: 'noopener' }, 'Hacker News ↗')] : null),
      item.forwardedAt
        ? el('p', { class: 'ja-meta ja-ok' }, `✓ Forwarded to ${item.forwardedTo} · ${when(item.forwardedAt)}${item.forwardCount > 1 ? ` · ${item.forwardCount}×` : ''}${item.applicantNotifiedAt ? ' · applicant told' : ''}`)
        : null,
      item.lastError ? el('p', { class: 'ja-meta ja-error' }, `Last send failed: ${item.lastError}`) : null,
      notes,
      el('div', { class: 'card-actions' },
        el('button', { class: item.forwardedAt ? '' : 'primary', onclick: () => forwardDialog(item) }, item.forwardedAt ? 'Forward again…' : 'Forward…'),
        item.status === 'rejected'
          ? el('button', { onclick: () => update(item, { status: item.forwardedAt ? 'forwarded' : 'new' }, 'Restored') }, 'Restore')
          : el('button', { class: 'danger', onclick: () => update(item, { status: 'rejected' }, 'Rejected') }, 'Reject')));
  }

  async function update(item, patch, done) {
    try {
      await api(`/${item.id}`, { method: 'PATCH', body: patch });
      toast(done);
      if (patch.status) load();
      else Object.assign(item, patch);
    } catch (error) {
      toast(error.message, 'error');
    }
  }

  function forwardDialog(item) {
    const first = firstName(item.name);
    const to = el('input', { type: 'text', required: true, placeholder: 'jobs@company.com', autocomplete: 'off' });
    const cc = el('input', { type: 'email', placeholder: 'optional', autocomplete: 'off' });
    const replyTo = el('input', { type: 'email', value: item.email, required: true });
    const subject = el('input', { type: 'text', value: `Application: ${item.name} for ${item.jobTitle}`, maxLength: 255, required: true });
    const message = el('textarea', { rows: 14, required: true, value: defaultMessage(item) });
    const notify = el('input', { type: 'checkbox', checked: !item.applicantNotifiedAt, disabled: !!item.applicantNotifiedAt });
    const suggestions = el('div', { class: 'ja-suggest muted' }, 'Looking for an email in the job post…');
    const error = el('p', { class: 'ja-error', role: 'alert' });
    const send = el('button', { class: 'primary', type: 'submit' }, 'Send');

    const dialog = el('dialog', { class: 'ask ja-dialog' },
      el('form', { method: 'dialog', onsubmit: submit },
        el('h2', {}, `Forward ${first}’s application`),
        el('p', { class: 'muted ja-meta' }, `From ${data.from || 'the backend’s sender'} · via Amazon SES`),
        el('label', {}, 'To (the job poster)', to), suggestions,
        el('div', { class: 'ja-row' }, el('label', {}, 'CC', cc), el('label', {}, 'Reply-To', replyTo)),
        el('label', {}, 'Subject', subject),
        el('label', {}, 'Message', message),
        el('label', { class: 'ja-check' }, notify, item.applicantNotifiedAt ? ' The applicant was already told it was forwarded' : ` Email ${first} that it was forwarded`),
        error,
        el('div', { class: 'card-actions' }, el('button', { type: 'button', onclick: () => dialog.close() }, 'Cancel'), send)));
    dialog.addEventListener('close', () => dialog.remove());
    document.body.append(dialog);
    dialog.showModal();
    to.focus();

    posterEmails(item, collection).then((emails) => {
      if (!emails.length) {
        suggestions.replaceChildren('No email in the job post — ', item.sourceUrl ? el('a', { href: item.sourceUrl, target: '_blank', rel: 'noopener' }, 'check the HN post ↗') : 'check the original post', '.');
        return;
      }
      if (!to.value) to.value = emails[0];
      suggestions.replaceChildren('From the job post: ', ...emails.map((email) =>
        el('button', { type: 'button', class: 'ja-chip', onclick: () => { to.value = email; to.focus(); } }, email)));
    });

    async function submit(event) {
      event.preventDefault();
      error.textContent = '';
      send.disabled = true;
      send.textContent = 'Sending…';
      try {
        const result = await api(`/${item.id}/forward`, {
          method: 'POST',
          body: { to: to.value, cc: cc.value, replyTo: replyTo.value, subject: subject.value, message: message.value, notifyApplicant: notify.checked && !notify.disabled },
        });
        dialog.close();
        toast(result.warning || `Forwarded to ${result.item.forwardedTo}`, result.warning ? 'error' : 'success');
        load();
      } catch (err) {
        error.textContent = err.message;
        send.disabled = false;
        send.textContent = 'Send';
      }
    }
  }

  load();
  return root;
}

function defaultMessage(item) {
  const first = firstName(item.name);
  return [
    `Hi${item.author ? ` ${item.author}` : ''},`,
    '',
    `${item.name} saw your post "${item.jobTitle}" on AngJobs (from the Hacker News “Who is hiring?” thread) and asked us to pass their application on to you:`,
    '',
    item.message ? item.message.trim() : `${first} didn’t include a message.`,
    '',
    `Just reply to this email to reach ${first} directly (${item.email}).`,
    '',
    '— AngJobs',
  ].join('\n');
}

// ── The job poster's address ──────────────────────────────────────────────────

const emailCache = new Map();

/** Addresses in the job's own entry in the site's static API (../api/<collection>/<slug>.json). */
function posterEmails(item, collection) {
  const slug = (() => { try { return new URL(item.jobUrl).pathname.match(/\/([^/]+)\/?$/)?.[1]; } catch { return null; } })();
  if (!slug) return Promise.resolve([]);
  if (!emailCache.has(slug)) {
    emailCache.set(slug, fetch(`../api/${collection}/${encodeURIComponent(slug)}.json`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((job) => findEmails(job.body || ''))
      .catch(() => []));
  }
  return emailCache.get(slug);
}

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function htmlToText(html) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code) => {
      if (code[0] !== '#') return NAMED[code.toLowerCase()] ?? m;
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    });
}

/**
 * Unique, lowercased email addresses in an HN post body, in order of
 * appearance. HN bodies are HTML with entities (&#x2F;, &#x40;, …) and often
 * obfuscate: "jobs [at] acme [dot] com", "jobs(at)acme.com", "jobs at acme dot com".
 */
export function findEmails(html) {
  const mailtos = [...String(html).matchAll(/mailto:([^"'?>\s]+)/gi)].map((m) => htmlToText(m[1]));
  const text = `${mailtos.join(' ')} ${htmlToText(String(html))}`
    .replace(/\s*[[({<]\s*(?:at|@)\s*[\])}>]\s*/gi, '@')
    .replace(/\s*[[({<]\s*(?:dot|\.)\s*[\])}>]\s*/gi, '.')
    .replace(/([\w.+-]+)\s+at\s+([\w-]+(?:\s+dot\s+[\w-]+)+)/gi, (_m, user, domain) => `${user}@${domain.replace(/\s+dot\s+/gi, '.')}`);
  const found = (text.match(/[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}/gi) || [])
    .map((email) => email.replace(/^\.+|\.+$/g, '').toLowerCase())
    .filter((email) => !/@(example\.com|angjobs\.com)$/.test(email));
  return [...new Set(found)];
}

// ── Small DOM helpers ─────────────────────────────────────────────────────────

// Like the admin's h(), but sets value/checked/disabled/… as properties, which
// form fields need (a textarea ignores a value attribute; checked="false" is checked).
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (key === 'class') node.className = value;
    else if (key === 'value' || (key in node && typeof value !== 'string')) node[key] = value;
    else node.setAttribute(key, value === true ? '' : value);
  }
  node.append(...children.flat(Infinity).filter((c) => c != null && c !== false));
  return node;
}

function toast(message, kind = 'success') {
  const node = el('div', { class: `toast toast-${kind}`, role: 'status' }, message);
  document.body.append(node);
  requestAnimationFrame(() => node.classList.add('visible'));
  setTimeout(() => { node.classList.remove('visible'); setTimeout(() => node.remove(), 400); }, kind === 'error' ? 6000 : 3000);
}

const when = (s) => { const d = new Date(/Z|[+-]\d\d:\d\d$/.test(s || '') ? s : `${s}Z`); return isNaN(d) ? '' : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); };
const firstName = (name) => (name || '').trim().split(/\s+/)[0] || 'the applicant';

// Screen styles, layered on admin.css and its tokens (light/dark for free).
// Added once; plugins have no admin stylesheet slot.
function injectStyles() {
  if (document.getElementById('ja-styles')) return;
  document.head.append(el('style', { id: 'ja-styles' }, `
.ja { max-width: 56rem; }
.ja-notice { max-width: 34rem; }
.ja-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; justify-content: space-between; margin-bottom: 1rem; }
.ja-tabs { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.ja-tabs button.current { background: var(--text); color: var(--bg); border-color: var(--text); }
.ja-count { margin-left: 0.4rem; font-size: 0.8em; opacity: 0.75; font-variant-numeric: tabular-nums; }
.ja-toolbar select { width: auto; }
.ja-list { display: flex; flex-direction: column; gap: 0.85rem; }
.ja-card { display: flex; flex-direction: column; gap: 0.4rem; }
.ja-card.ja-rejected { opacity: 0.7; }
.ja-top { display: flex; align-items: center; gap: 0.6rem; }
.ja-when { margin-left: auto; font-size: 0.85rem; }
.ja-badge { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; padding: 0.1rem 0.5rem; border-radius: 999px; border: 1px solid var(--border); }
.ja-badge-new { color: var(--accent); border-color: var(--accent); }
.ja-badge-forwarded { color: var(--ok); border-color: var(--ok); }
.ja-badge-rejected { color: var(--muted); }
.ja-job { margin: 0; font-size: 1.02rem; line-height: 1.35; }
.ja-job a { color: var(--text); }
.ja-applicant { margin: 0; }
.ja-meta { margin: 0; font-size: 0.875rem; }
.ja-ok { color: var(--ok); }
.ja-error { color: var(--danger); font-size: 0.875rem; margin: 0; }
.ja-error:empty { display: none; }
.ja-message summary { cursor: pointer; color: var(--muted); font-size: 0.875rem; }
.ja-message p { white-space: pre-wrap; overflow-wrap: anywhere; margin: 0.4rem 0 0; padding: 0.6rem 0.8rem; background: var(--bg); border-radius: var(--radius); }
.ja-notes { font-size: 0.875rem; min-height: 2.4rem; }
.ja-empty { padding: 2rem 0; }
.ja-from { margin-top: 1.5rem; font-size: 0.85rem; }
dialog.ja-dialog { max-width: 40rem; width: calc(100vw - 2rem); }
.ja-dialog form { display: flex; flex-direction: column; gap: 0.6rem; }
.ja-dialog label { display: flex; flex-direction: column; font-weight: 600; font-size: 0.875rem; }
.ja-dialog textarea { font-family: inherit; }
.ja-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.ja-check { flex-direction: row !important; align-items: center; gap: 0.4rem; font-weight: 400 !important; }
.ja-check input { width: auto; margin: 0; }
.ja-suggest { font-size: 0.85rem; margin-top: -0.3rem; display: flex; flex-wrap: wrap; gap: 0.35rem; align-items: center; }
.ja-chip { font-size: 0.8rem; padding: 0.1rem 0.55rem; border-radius: 999px; }
@media (max-width: 600px) { .ja-row { grid-template-columns: 1fr; } }
`));
}
