// api-form plugin — declare forms in config, POST them to a named backend
// service. Write [[form:<name>]] (name: lowercase letters, digits, hyphens)
// in any page's Markdown and it becomes a plain HTML form posting to
// services.<service> + the form's path.
//
// The backend's side of the contract: accept a regular urlencoded form POST
// and answer with a page or redirect back — that is the no-JS path (C5) —
// and send CORS headers + a 2xx for the fetch path (client.js). "encoding":
// "json" only changes what client.js sends; the no-JS fallback is always
// urlencoded, so a json form's backend must accept both.
//
// site.config.json:
//   "services":      { "backend": "https://api.example.com" },
//   "pluginOptions": { "api-form": { "forms": { "signup": {
//     "path": "/signups", "encoding": "json", "button": "Sign up",
//     "fields": [{ "name": "email", "type": "email", "label": "Email", "required": true }],
//     "hidden": { "source": "site", "job": "{page.title}" }, "success": "You're in!", "storageKey": "signedUp",
//     "closes": "2026-08-01", "closedMessage": "Sign-ups are closed."
//   } } } }
//
// "closes" (ISO date) prints a static deadline line and lets client.js swap
// the form for closedMessage once the date has passed on the visitor's
// clock. The build stays deterministic (never reads the current time), so
// without JavaScript the form stays visible — the backend is the authority
// and must reject late submissions itself.

import { escapeHtml, formatDate, isIsoDate } from '../../lib/util.js';

const MARKER = /\[\[form:([a-z0-9-]+)\]\]/g;

function fieldHtml(field) {
  const name = escapeHtml(field.name);
  const input = field.type === 'textarea'
    ? `<textarea name="${name}" rows="5"${field.required ? ' required' : ''}></textarea>`
    : `<input type="${escapeHtml(field.type || 'text')}" name="${name}"${field.required ? ' required' : ''}>`;
  return `  <label>${escapeHtml(field.label || field.name)} ${input}</label>`;
}

function formHtml(form, base, language, page) {
  // Hidden values may reference the page they render on with {page.field}
  // tokens ("{page.url}", "{page.title}", …) — resolved at build time, so a
  // form on many pages (e.g. a job board's apply form) carries per-page
  // context without per-page config.
  const fill = (value) => String(value).replace(/\{page\.([A-Za-z][\w-]*)\}/g, (_m, key) => page?.[key] ?? '');
  const hidden = Object.entries(form.hidden || {})
    .map(([key, value]) => `  <input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(fill(value))}">`);
  const storage = form.storageKey ? ` data-storage-key="${escapeHtml(form.storageKey)}"` : '';
  const closes = form.closes ? ` data-closes="${form.closes}" data-closed-message="${escapeHtml(form.closedMessage || 'Sign-ups are closed.')}"` : '';
  return [
    `<form class="api-form" method="POST" action="${escapeHtml(base + form.path)}" data-encoding="${form.encoding === 'json' ? 'json' : 'form'}" data-success="${escapeHtml(form.success || 'Thanks — got it.')}"${storage}${closes}>`,
    ...hidden,
    ...(form.fields || []).map(fieldHtml),
    `  <button type="submit">${escapeHtml(form.button || 'Submit')}</button>`,
    ...(form.closes ? [`  <p class="api-form-deadline">Sign-ups close on ${formatDate(form.closes, language)}.</p>`] : []),
    '</form>',
  ].join('\n');
}

export default {
  renderPage(page, html, site, options) {
    if (!html.includes('[[form:')) return html;
    const service = options.service || 'backend';
    const base = site.config.services?.[service];
    if (!base) return html.replace(MARKER, `<p><em>api-form: set "services": { "${service}": "https://…" } in site.config.json to enable this form.</em></p>`);
    return html.replace(MARKER, (marker, name) => {
      const form = options.forms?.[name];
      // An unknown name stays visible as written — pages may quote the
      // syntax in code samples; a declared form with a bad path is config.
      if (!form) {
        console.warn(`api-form: ${page.url} contains ${marker} but no form "${name}" is declared — if a form was meant, add it under pluginOptions.api-form.forms in site.config.json`);
        return marker;
      }
      if (!/^\//.test(form.path || '')) throw new Error(`form "${name}" needs a "path" starting with "/" — e.g. "path": "/signups" under pluginOptions.api-form.forms.${name} in site.config.json`);
      if (form.closes && !isIsoDate(form.closes)) throw new Error(`form "${name}" has "closes": ${JSON.stringify(form.closes)} — use an ISO date like "2026-08-01"`);
      return formHtml(form, base, site.config.site?.language, page);
    });
  },
};
