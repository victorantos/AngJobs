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
//     "closes": "2026-08-01", "closedMessage": "Sign-ups are closed.",
//     "honeypot": "website", "proof": "elapsed"
//   } } } }
//
// "closes" (ISO date) prints a static deadline line and lets client.js swap
// the form for closedMessage once the date has passed on the visitor's
// clock. The build stays deterministic (never reads the current time), so
// without JavaScript the form stays visible — the backend is the authority
// and must reject late submissions itself.
//
// "honeypot" (a field name, per form or once for the whole plugin) adds a
// text input that people never see: client.css moves it off-screen, it is
// skipped by Tab and by autofill, and it carries no visible label. Comment-
// spam bots fill every input they find, so the backend's side of this
// contract is: when that field arrives non-empty, answer success and store
// nothing. It costs a real applicant nothing — no challenge, no script, no
// third party — which is why it is the first line of defence, not a CAPTCHA.
//
// "proof" (a field name, per form or plugin-wide) is the second line: client.js
// adds a hidden field of that name and, on submit, fills it with the whole
// seconds between page load and the click. A bot that scrapes the HTML and
// POSTs it never sends the field. Neither does a person with JavaScript off,
// so the backend's side of this contract is to hold a post without it for
// review — never to reject it (C5). Both are opt-in: a form without them
// renders exactly as before.

import { escapeHtml, formatDate, isIsoDate, dateLocale } from '../../lib/util.js';

const MARKER = /\[\[form:([a-z0-9-]+)\]\]/g;
const FIELD_NAME = /^[a-z][a-z0-9_-]*$/;

function fieldHtml(field) {
  const name = escapeHtml(field.name);
  const input = field.type === 'textarea'
    ? `<textarea name="${name}" rows="5"${field.required ? ' required' : ''}></textarea>`
    : `<input type="${escapeHtml(field.type || 'text')}" name="${name}"${field.required ? ' required' : ''}>`;
  return `  <label>${escapeHtml(field.label || field.name)} ${input}</label>`;
}

// The trap is a real, labelled text input — exactly what a form-filling bot
// looks for — hidden by CSS rather than type="hidden", which bots skip. It is
// never type="hidden" and never display:none inline: some bots read inline
// styles, none read the stylesheet. aria-hidden + tabindex="-1" keep it out
// of the accessibility tree and the Tab order; autocomplete="off" keeps a
// browser from filling it for a real person.
function honeypotHtml(name) {
  return `  <div class="api-form-trap" aria-hidden="true"><label>Leave this field empty <input type="text" name="${escapeHtml(name)}" tabindex="-1" autocomplete="off"></label></div>`;
}

// "honeypot" and "proof" name extra fields the backend must be able to tell
// apart from the real ones, so neither may reuse a declared or hidden name.
function extraFieldName(formName, form, options, key, example) {
  const name = form[key] ?? options[key];
  if (name === undefined || name === null || name === '' || name === false) return null;
  const where = `pluginOptions.api-form.forms.${formName}.${key} in site.config.json`;
  if (typeof name !== 'string' || !FIELD_NAME.test(name)) throw new Error(`form "${formName}" has "${key}": ${JSON.stringify(name)} — use a field name like "${example}" (lowercase letters, digits, "-" or "_") at ${where}`);
  const taken = [...(form.fields || []).map((f) => f.name), ...Object.keys(form.hidden || {})];
  if (taken.includes(name)) throw new Error(`form "${formName}" uses "${name}" both as a real field and as the ${key} — it must be a name no real field has, so the backend can tell them apart; pick another at ${where}`);
  return name;
}

function formHtml(formName, form, base, language, page, options) {
  // Hidden values may reference the page they render on with {page.field}
  // tokens ("{page.url}", "{page.title}", …) — resolved at build time, so a
  // form on many pages (e.g. a job board's apply form) carries per-page
  // context without per-page config.
  const fill = (value) => String(value).replace(/\{page\.([A-Za-z][\w-]*)\}/g, (_m, key) => page?.[key] ?? '');
  const hidden = Object.entries(form.hidden || {})
    .map(([key, value]) => `  <input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(fill(value))}">`);
  const storage = form.storageKey ? ` data-storage-key="${escapeHtml(form.storageKey)}"` : '';
  const closes = form.closes ? ` data-closes="${form.closes}" data-closed-message="${escapeHtml(form.closedMessage || 'Sign-ups are closed.')}"` : '';
  const trap = extraFieldName(formName, form, options, 'honeypot', 'website');
  const proofName = extraFieldName(formName, form, options, 'proof', 'elapsed');
  if (trap && proofName && trap === proofName) throw new Error(`form "${formName}" uses "${trap}" as both honeypot and proof — give them different names at pluginOptions.api-form.forms.${formName} in site.config.json`);
  const proof = proofName ? ` data-proof="${escapeHtml(proofName)}"` : '';
  return [
    `<form class="api-form" method="POST" action="${escapeHtml(base + form.path)}" data-encoding="${form.encoding === 'json' ? 'json' : 'form'}" data-success="${escapeHtml(form.success || 'Thanks — got it.')}"${storage}${closes}${proof}>`,
    ...hidden,
    ...(trap ? [honeypotHtml(trap)] : []),
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
      return formHtml(name, form, base, dateLocale(site.config.site, site.config.site?.language), page, options);
    });
  },
};
