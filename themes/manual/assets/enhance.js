// enhance.js — progressive enhancement only (cms-spec.md C5).
// The template engine has no comparisons, so the "you are here" marker in
// the sidebar is added client-side by matching pathnames. Without JavaScript
// the breadcrumb and page title keep the reader oriented.

const normalize = (path) => (path.endsWith('/') ? path : path + '/');
const here = normalize(location.pathname);

for (const link of document.querySelectorAll('.doc-tree a')) {
  if (normalize(new URL(link.href).pathname) === here) {
    link.setAttribute('aria-current', 'page');
  }
}
