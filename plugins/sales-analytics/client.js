// sales-analytics — browser part. On every page, POST a view beacon and a click
// beacon for any [data-cta] element to your configured backend (the services.<service>
// /events endpoint). No cookies; nothing is stored on-device. CTA links work with
// JavaScript off — the beacon is pure enhancement (C5). The reports themselves are
// viewed in the admin's Insights tab (GET /reports), not here. Discloses one network
// call per the plugins-registry rule.

const opts = JSON.parse(document.getElementById('plugin-options')?.textContent || '{}');
const cfg = opts['sales-analytics'] || {};
const api = (opts.$services || {})[cfg.service || 'backend'] || null;

if (api) {
  const send = (body) => {
    try {
      const json = JSON.stringify(body);
      if (navigator.sendBeacon) navigator.sendBeacon(`${api}/events`, new Blob([json], { type: 'application/json' }));
      else fetch(`${api}/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: json, keepalive: true }).catch(() => {});
    } catch { /* tracking must never break the page */ }
  };
  send({ type: 'view', page: location.pathname, ref: document.referrer || null });
  document.addEventListener('click', (event) => {
    const el = event.target.closest?.('[data-cta]');
    if (el) send({ type: 'click', page: location.pathname, cta: el.getAttribute('data-cta') });
  }, { capture: true });
}
