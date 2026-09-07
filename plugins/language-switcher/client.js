// language-switcher — progressive enhancement. Builds a footer language switcher
// from the hreflang alternates the i18n build emits in <head> (one <link> per
// language version of this page, including itself). No-ops with fewer than two,
// so single-language sites and untranslated pages show nothing. Theme-agnostic.

const options = JSON.parse(document.getElementById('plugin-options')?.textContent || '{}')['language-switcher'] || {};
const labels = options.labels || {};

const seen = new Set();
const langs = [];
for (const link of document.querySelectorAll('link[rel="alternate"][hreflang]')) {
  const lang = link.hreflang;
  if (!lang || lang === 'x-default' || seen.has(lang)) continue;
  seen.add(lang);
  langs.push({ lang, path: new URL(link.href).pathname }); // same-origin navigation
}

if (langs.length >= 2) {
  const current = document.documentElement.lang;
  const nav = document.createElement('nav');
  nav.className = 'language-switcher';
  nav.setAttribute('aria-label', 'Language');
  for (const { lang, path } of langs) {
    const label = labels[lang] || endonym(lang) || lang;
    if (lang === current) {
      const span = document.createElement('span');
      span.setAttribute('aria-current', 'true');
      span.setAttribute('lang', lang);
      span.textContent = label;
      nav.append(span);
    } else {
      const a = document.createElement('a');
      a.href = path;
      a.hreflang = lang;
      a.setAttribute('lang', lang);
      a.textContent = label;
      nav.append(a);
    }
  }
  const mount = document.querySelector('[data-language-switcher]') || document.querySelector('footer');
  mount?.append(nav);
}

// Best-effort native language name: "de" → "Deutsch", "fr" → "Français".
function endonym(code) {
  try {
    const name = new Intl.DisplayNames([code], { type: 'language' }).of(code);
    return name && name !== code ? name.charAt(0).toUpperCase() + name.slice(1) : null;
  } catch { return null; }
}
