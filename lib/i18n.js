// lib/i18n.js — multilingual support (cms-spec.md §5.4): sibling-file
// translations (about.fr.md → /fr/about/), per-language collection views,
// and the {{ strings.* }} theme dictionary with per-key fallback.
//
// Isomorphic: never imports node:* — the admin uses splitLangSuffix in the
// browser so translated filenames survive the editor's slug handling.

/** Engine defaults for theme UI strings ({{ strings.* }} in templates).
    Themes override per key with strings.json; sites with data/strings.<lang>.json. */
export const DEFAULT_STRINGS = {
  skipToContent: 'Skip to content',
  readMore: 'Read more',
  postedOn: 'Posted on',
  searchPlaceholder: 'Type to search…',
  nothingHere: 'Nothing here yet.',
  newer: '← Newer',
  older: 'Older →',
  page: 'Page',
  of: 'of',
  notFoundTitle: 'Page not found',
  notFoundBody: 'There’s no page at this address. It may have moved, or the link may be mistyped.',
  goHome: 'Go to the homepage',
};

/** The configured language list when i18n is active, else []. Active means
    site.languages names 2+ codes and includes the default site.language. */
export function activeLanguages(site) {
  const languages = site.languages || [];
  return languages.length >= 2 && languages.includes(site.language) ? languages : [];
}

/** Split a translation suffix off a file name: "about.fr" → { base: "about",
    lang: "fr" } when "fr" is a configured language, else { base: name, lang: null }. */
export function splitLangSuffix(name, languages) {
  const dot = name.lastIndexOf('.');
  const lang = dot > 0 ? name.slice(dot + 1) : '';
  return languages.includes(lang) ? { base: name.slice(0, dot), lang } : { base: name, lang: null };
}

/** The {{ strings }} dictionary for one language: engine defaults, then the
    theme's strings.json, then data/strings.<default>.json, then — per key,
    so anything missing falls back to the default language — data/strings.<lang>.json. */
export function stringsFor(lang, defaultLang, themeStrings, data) {
  const base = { ...DEFAULT_STRINGS, ...themeStrings, ...data[`strings.${defaultLang}`] };
  return lang === defaultLang ? base : { ...base, ...data[`strings.${lang}`] };
}

/** The per-language view of every collection: each item replaced by its <lang>
    translation when one exists, else kept in the default language — so lists
    and data-only collections stay complete, in the default sort order. */
export function localizedCollections(collections, translations, lang) {
  const out = {};
  for (const [name, items] of Object.entries(collections)) {
    const bySlug = new Map((translations[name] || []).filter((t) => t.language === lang).map((t) => [t.slug, t]));
    out[name] = items.map((item) => bySlug.get(item.slug) || item);
  }
  return out;
}

/** The navigation for one language: default entries, with the label overridden by
    data/navigation.<lang>.json (matched on the default url) and the url localized
    to /<lang>/… where that page has a translation. Per-entry fallback — a missing
    label stays in the default language, so a partial file is fine. */
export function localizedNav(navigation, langNav, lang, translatedUrls) {
  const labels = new Map((langNav || []).map((entry) => [entry.url, entry.label]));
  return navigation.map((entry) => ({
    ...entry,
    label: labels.get(entry.url) ?? entry.label,
    url: translatedUrls.has(`/${lang}${entry.url}`) ? `/${lang}${entry.url}` : entry.url,
  }));
}
