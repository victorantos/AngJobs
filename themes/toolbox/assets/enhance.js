// enhance.js — progressive enhancement only (cms-spec.md C5).
// The site is fully readable and navigable without this file.

// Before/after gallery: a paragraph holding exactly two images whose alt
// text starts with "Before" and "After" becomes a labelled side-by-side
// pair. Without JS the images simply stack — nothing is lost.
for (const p of document.querySelectorAll('.prose p')) {
  const imgs = p.querySelectorAll('img');
  if (imgs.length !== 2 || p.childElementCount !== 2) continue;
  const first = (imgs[0].alt || '').trim().toLowerCase();
  const second = (imgs[1].alt || '').trim().toLowerCase();
  if (!first.startsWith('before') || !second.startsWith('after')) continue;
  p.classList.add('before-after');
  imgs.forEach((img, index) => {
    const figure = document.createElement('figure');
    const caption = document.createElement('figcaption');
    caption.textContent = index === 0 ? 'Before' : 'After';
    img.replaceWith(figure);
    figure.append(img, caption);
  });
}
