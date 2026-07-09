// enhance.js — progressive enhancement only (cms-spec.md C5).
// The site is fully readable and navigable without this file.

// Add a "Copy" button to every code block.
if (navigator.clipboard) {
  for (const code of document.querySelectorAll('pre > code')) {
    const pre = code.parentElement;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-code';
    button.textContent = 'Copy';
    button.addEventListener('click', async () => {
      await navigator.clipboard.writeText(code.textContent);
      button.textContent = 'Copied';
      setTimeout(() => { button.textContent = 'Copy'; }, 1500);
    });
    pre.append(button);
  }
}
