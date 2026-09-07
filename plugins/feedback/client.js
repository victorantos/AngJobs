// feedback plugin — a floating widget: a button that opens a small popup where a
// visitor types a message and sends it to your backend's POST /feedback. Pure
// progressive enhancement — with JavaScript off, nothing renders and the page is
// unaffected. The widget stays hidden unless a `services` endpoint is configured.

const opts = JSON.parse(document.getElementById('plugin-options')?.textContent || '{}');
const cfg = opts.feedback || {};
const api = (opts.$services || {})[cfg.service || 'backend'] || null;

if (api) mount();

function mount() {
  const title = cfg.title || 'Send feedback';
  const label = cfg.buttonLabel || 'Feedback';

  const root = document.createElement('div');
  root.className = 'plain-feedback';
  root.innerHTML = `
    <button class="pf-toggle" type="button" aria-expanded="false" aria-controls="pf-panel">
      <span aria-hidden="true">💬</span> ${esc(label)}
    </button>
    <div class="pf-panel" id="pf-panel" role="dialog" aria-label="${esc(title)}" hidden>
      <div class="pf-head"><strong>${esc(title)}</strong><button class="pf-close" type="button" aria-label="Close">×</button></div>
      <form class="pf-form">
        <textarea class="pf-message" rows="4" required placeholder="What's on your mind?"></textarea>
        <input class="pf-email" type="email" autocomplete="email" placeholder="Email (optional)">
        <button class="pf-send" type="submit">Send</button>
      </form>
    </div>`;
  document.body.append(root);

  // showOnScroll: true (default 200px) or a pixel threshold — the widget is only
  // visible while the page is scrolled past that point (scrolling back up hides
  // it again), except while the panel is open: it never vanishes mid-typing.
  if (cfg.showOnScroll) {
    const threshold = typeof cfg.showOnScroll === 'number' ? cfg.showOnScroll : 200;
    const sync = () => root.classList.toggle('pf-waiting',
      window.scrollY < threshold && root.querySelector('.pf-panel').hidden);
    window.addEventListener('scroll', sync, { passive: true });
    sync();
  }

  const toggle = root.querySelector('.pf-toggle');
  const panel = root.querySelector('.pf-panel');
  const open = (yes) => {
    panel.hidden = !yes;
    toggle.setAttribute('aria-expanded', String(yes));
    if (yes) root.querySelector('.pf-message')?.focus();
  };
  toggle.addEventListener('click', () => open(panel.hidden));
  root.addEventListener('click', (e) => { if (e.target.classList.contains('pf-close')) open(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) open(false); });

  root.querySelector('.pf-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const message = form.querySelector('.pf-message').value.trim();
    if (!message) return;
    const send = form.querySelector('.pf-send');
    send.disabled = true;
    send.textContent = 'Sending…';
    form.querySelector('.pf-error')?.remove();
    try {
      const res = await fetch(`${api}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, email: form.querySelector('.pf-email').value.trim() || null, page: location.pathname }),
      });
      if (!res.ok) throw new Error();
      panel.innerHTML = `<div class="pf-head"><strong>${esc(title)}</strong><button class="pf-close" type="button" aria-label="Close">×</button></div><p class="pf-thanks">Thanks — we got your message. 🙏</p>`;
      setTimeout(() => open(false), 2500);
    } catch {
      send.disabled = false;
      send.textContent = 'Send';
      const error = document.createElement('p');
      error.className = 'pf-error';
      error.textContent = "Couldn't send — please try again.";
      form.append(error);
    }
  });
}

function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
