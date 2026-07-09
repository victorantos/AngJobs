// enhance.js — progressive enhancement only (cms-spec.md C5).
// The site is fully readable without this. It adds one nicety: datelines on
// the front page younger than a day read as "3 hours ago" instead of a date,
// with the exact date kept in the datetime attribute and the title.

const HOUR = 3600e3;
const now = Date.now();

for (const time of document.querySelectorAll('.front time[datetime]')) {
  const stamp = Date.parse(time.getAttribute('datetime'));
  if (Number.isNaN(stamp)) continue;
  const age = now - stamp;
  if (age < 0 || age > 24 * HOUR) continue;
  const hours = Math.max(1, Math.round(age / HOUR));
  time.title = time.textContent;
  time.textContent = hours === 1 ? '1 hour ago' : `${hours} hours ago`;
}
