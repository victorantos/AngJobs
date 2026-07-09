// enhance.js — progressive enhancement only (cms-spec.md C5).
// Adds an estimated reading time to the essay's meta line. Without JS the
// meta line simply shows the date — nothing is lost.

const body = document.querySelector('.essay-body');
const meta = document.querySelector('.essay-meta');
if (body && meta) {
  const words = (body.textContent || '').trim().split(/\s+/).filter(Boolean).length;
  if (words > 0) {
    const minutes = Math.max(1, Math.round(words / 220));
    const span = document.createElement('span');
    span.className = 'read-time';
    span.textContent = ` · ${minutes} min read`;
    meta.append(span);
  }
}
