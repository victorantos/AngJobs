// enhance.js — progressive enhancement only (cms-spec.md C5).
// The timetable is fully readable without JavaScript. With it, today's
// day block gets a highlight (the theme.css .is-today styles) so a phone
// at arm's length answers "can I go today?" in one glance.

const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

for (const day of document.querySelectorAll('.timetable .day')) {
  if (day.dataset.day === dayName) day.classList.add('is-today');
}
