// enhance.js — progressive enhancement only (cms-spec.md C5).
// The photo gallery on a listing works as a scrollable grid without this.
// With it, arrow keys step focus between photos once one is focused.

const photos = [...document.querySelectorAll('.gallery img')];
if (photos.length > 1) {
  photos.forEach((img, i) => {
    img.tabIndex = 0;
    img.addEventListener('keydown', (event) => {
      const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (!step) return;
      event.preventDefault();
      photos[(i + step + photos.length) % photos.length].focus();
    });
  });
}
