// enhance.js — progressive enhancement only (cms-spec.md C5).
// The build can't know "today", so past shows are marked client-side: rows
// whose date is behind us get a .played dimming. Without JavaScript the
// list is simply all shows, newest first — still correct, just undimmed.

const today = new Date();
today.setHours(0, 0, 0, 0);

for (const row of document.querySelectorAll('.show-row')) {
  const time = row.querySelector('time[datetime]');
  if (!time) continue;
  const when = new Date(time.getAttribute('datetime'));
  if (!Number.isNaN(when.getTime()) && when < today) row.classList.add('played');
}
