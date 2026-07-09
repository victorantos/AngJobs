// enhance.js — progressive enhancement only (cms-spec.md C5).
// The site is fully readable and navigable without this file.
//
// One enhancement: gallery images ease in as they finish loading, so the
// grid fills like prints going up on a wall. Skipped entirely when the
// visitor prefers reduced motion.

if (matchMedia('(prefers-reduced-motion: no-preference)').matches) {
  document.documentElement.classList.add('enhanced');
  for (const img of document.querySelectorAll('.work-card img, .project-cover img')) {
    if (img.complete) {
      img.classList.add('is-loaded');
    } else {
      const reveal = () => img.classList.add('is-loaded');
      img.addEventListener('load', reveal, { once: true });
      img.addEventListener('error', reveal, { once: true });
    }
  }
}
