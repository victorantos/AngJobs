// enhance.js — progressive enhancement only (cms-spec.md C5).
// Adds a copy-link button beside each release on the changelog so a teammate
// can paste "the release where we fixed that" into chat. The links work
// without it; this just puts them on the clipboard.

if (navigator.clipboard) {
  for (const release of document.querySelectorAll('.timeline .release-title a')) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-link';
    button.textContent = '#';
    button.title = 'Copy link to this release';
    button.setAttribute('aria-label', `Copy link to ${release.textContent}`);
    button.style.font = 'inherit';
    button.style.cursor = 'pointer';
    button.style.marginLeft = '0.5rem';
    button.addEventListener('click', async () => {
      await navigator.clipboard.writeText(release.href);
      button.textContent = '✓';
      setTimeout(() => { button.textContent = '#'; }, 1200);
    });
    release.after(button);
  }
}
