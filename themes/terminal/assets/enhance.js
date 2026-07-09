// enhance.js — progressive enhancement only (cms-spec.md C5).
// Without this file the site is fully readable: code blocks are framed and
// scrollable, headings have anchor ids, every link works. This adds:
//   1. a language badge + copy button on fenced code blocks
//   2. a table of contents on posts with more than three headings
//   3. keyboard navigation (j/k on lists, [ and ] between posts)

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  node.className = className;
  if (text) node.textContent = text;
  return node;
};

// --- 1. code blocks: language badge + copy button ---------------------------
for (const code of document.querySelectorAll('.prose pre > code')) {
  const pre = code.parentElement;
  if (pre.classList.contains('static')) continue; // the 404 transcript
  const lang = (code.className.match(/language-([\w+-]+)/) || [])[1];
  const bar = el('div', 'code-bar');
  bar.append(el('span', 'code-lang', lang || 'text'));
  if (navigator.clipboard) {
    const button = el('button', 'copy-code', 'copy');
    button.type = 'button';
    button.addEventListener('click', async () => {
      await navigator.clipboard.writeText(code.textContent);
      button.textContent = 'copied';
      setTimeout(() => { button.textContent = 'copy'; }, 1500);
    });
    bar.append(button);
  }
  pre.prepend(bar);
}

// --- 2. table of contents on longer posts -----------------------------------
const slugify = (text) => text.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '');
const postHeader = document.querySelector('.post .post-header');
const prose = document.querySelector('.post .prose');
const headings = prose ? [...prose.querySelectorAll('h2, h3')] : [];
if (postHeader && headings.length > 3) {
  const toc = el('nav', 'toc');
  toc.setAttribute('aria-label', 'Contents');
  toc.append(el('p', 'toc-title', 'Contents'));
  const list = document.createElement('ol');
  for (const heading of headings) {
    if (!heading.id) heading.id = slugify(heading.textContent) || 'section';
    const item = el('li', `toc-${heading.tagName.toLowerCase()}`);
    const link = document.createElement('a');
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;
    item.append(link);
    list.append(item);
  }
  toc.append(list);
  postHeader.after(toc);
}

// --- 3. keyboard navigation --------------------------------------------------
// j/k move focus through the archive (Enter opens — it's a real link);
// [ and ] follow rel="prev"/rel="next" if the page declares them.
const rows = [...document.querySelectorAll('.post-list h2 a')];
const relHref = (rel) =>
  document.querySelector(`link[rel="${rel}"], a[rel="${rel}"]`)?.href;

const typing = (target) =>
  target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName);

document.addEventListener('keydown', (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey || typing(event.target)) return;
  if (rows.length && (event.key === 'j' || event.key === 'k')) {
    const current = rows.indexOf(document.activeElement);
    const next = event.key === 'j'
      ? Math.min(current + 1, rows.length - 1)
      : Math.max(current - 1, 0);
    rows[next].focus();
    event.preventDefault();
  } else if (event.key === '[' || event.key === ']') {
    const href = relHref(event.key === '[' ? 'prev' : 'next');
    if (href) location.assign(href);
  }
});

// Document the keys — the hint exists only when the keys do.
const hints = [];
if (rows.length) hints.push('<kbd>j</kbd>/<kbd>k</kbd> move · <kbd>Enter</kbd> open');
if (relHref('prev') || relHref('next')) hints.push('<kbd>[</kbd>/<kbd>]</kbd> prev/next post');
const footer = document.querySelector('.colophon');
if (footer && hints.length) {
  const hint = el('p', 'kbd-hint');
  hint.innerHTML = hints.join(' · ');
  footer.append(hint);
}
