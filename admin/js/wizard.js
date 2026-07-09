// admin/js/wizard.js — the first-run setup wizard (cms-spec.md §8.5).
// Runs when the site still has the template placeholder title. Nothing is
// committed until the final "Go live" step; back always works; every step
// can be skipped ("Skip setup" keeps the site as-is).

import { h, show, toast, watchBuild } from './ui.js';
import { loadThemes, themePreview, applyStarter } from './appearance.js';

const CATEGORIES = { default: 'Blog / personal site', toolbox: 'Trades & local services', studio: 'Portfolio', bistro: 'Restaurant / café', manual: 'Documentation' };

export async function wizardScreen(siteInfo, onDone) {
  const themes = await loadThemes();
  const state = { theme: themes.find((t) => t.name === siteInfo.site.theme) || themes[0], title: '', tagline: '' };
  let step = 0;

  const dots = () => h('p', { class: 'wizard-dots' }, [0, 1, 2, 3].map((n) => h('span', { class: n === step ? 'dot on' : 'dot' })));
  const nav = (next, { nextLabel = 'Continue', canBack = true } = {}) => h('div', { class: 'wizard-nav' },
    canBack && step > 0 ? h('button', { onclick: () => go(step - 1) }, '← Back') : h('span'),
    h('button', { class: 'primary', onclick: next }, nextLabel));
  const skip = h('p', { class: 'muted' }, h('button', { class: 'linklike', onclick: () => { localStorage.setItem('plain.wizard', 'skipped'); onDone(); } }, 'Skip setup — I’ll explore on my own'));

  function go(n) { step = n; steps[step](); }

  const steps = [
    // 1. What are you building? — the highest-leverage question.
    () => paint(h('div', {},
      h('h1', {}, 'What are you building?'),
      h('p', { class: 'muted' }, 'This picks a look, the right content types, and example content. Everything can be changed later.'),
      h('div', { class: 'cards' }, themes.map((theme) => h('button', { class: `card pick ${theme === state.theme ? 'picked' : ''}`, onclick: () => { state.theme = theme; go(1); } },
        h('h2', {}, CATEGORIES[theme.name] || theme.title),
        h('p', { class: 'muted' }, theme.description)))),
      skip)),

    // 2. Name it — title and one-line tagline, nothing else.
    () => {
      const title = h('input', { type: 'text', value: state.title, placeholder: 'e.g. The Corner Table' });
      const tagline = h('input', { type: 'text', value: state.tagline, placeholder: 'One sentence about it (optional)' });
      paint(h('div', { class: 'wizard-narrow' },
        h('h1', {}, 'Name your site'),
        h('label', { class: 'field' }, 'Site name', title),
        h('label', { class: 'field' }, 'Tagline', tagline),
        nav(() => {
          if (!title.value.trim()) return toast('Give it a name — you can always change it.', 'error');
          state.title = title.value.trim();
          state.tagline = tagline.value.trim();
          go(2);
        })));
    },

    // 3. See it — the chosen look already wearing their name.
    async () => {
      const iframe = h('iframe', { class: 'tryon-frame wizard-frame', title: 'Preview of your site' });
      paint(h('div', {},
        h('h1', {}, 'Here’s your site'),
        h('p', { class: 'muted' }, 'Your name, in the look you picked. Real pages, not a mockup.'),
        iframe,
        nav(() => go(3), { nextLabel: 'Looks great' }),
        h('p', {}, h('button', { class: 'linklike', onclick: () => go(0) }, 'Try another look'))));
      try {
        const preview = { ...siteInfo, site: { ...siteInfo.site, title: state.title, description: state.tagline } };
        iframe.srcdoc = await themePreview(state.theme.name, preview, {});
      } catch (error) { toast(error.message, 'error'); }
    },

    // 4. Go live — the only step that writes anything.
    () => {
      const progress = h('p', { class: 'muted' }, '');
      let publishing = false;
      async function publish() {
        if (publishing) return;
        publishing = true;
        try {
          const commitSha = await applyStarter(state.theme, siteInfo, {
            site: { title: state.title, description: state.tagline },
            log: (message) => { progress.textContent = message; },
          });
          localStorage.setItem('plain.wizard', 'done');
          progress.textContent = '';
          watchBuild(commitSha, siteInfo.site.url);
          paint(h('div', { class: 'wizard-narrow' },
            h('h1', {}, '🎉 You’re live'),
            h('p', {}, `${state.title} is publishing right now — it takes about 30 seconds.`),
            h('p', {}, h('a', { href: siteInfo.site.url, target: '_blank', rel: 'noopener' }, 'Open your site ↗')),
            h('p', { class: 'muted' }, 'The example pages are marked “Example” — rewriting them in your own words takes minutes, and History means nothing you do can be lost.'),
            h('button', { class: 'primary', onclick: onDone }, 'Go to your dashboard')));
        } catch (error) {
          publishing = false;
          toast(error.message, 'error');
        }
      }
      paint(h('div', { class: 'wizard-narrow' },
        h('h1', {}, 'Ready to go live?'),
        h('p', {}, `“${state.title}” — ${CATEGORIES[state.theme.name] || state.theme.title}, with example content you can rewrite from the dashboard.`),
        progress,
        nav(publish, { nextLabel: 'Publish my site' }),
        skip));
    },
  ];

  function paint(content) {
    show(h('div', { class: 'wizard' }, dots(), content));
  }

  go(0);
  return h('span'); // wizard paints itself; router needs an element
}
