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

// The masthead search box is a plain GET form aimed at /search/, so it works
// with JavaScript off. The search plugin reads ?q= itself — prefilling its own
// input, running the query and keeping the URL in step — so all that is left
// here is showing the same query in the masthead box you typed it into.
const query = new URLSearchParams(location.search).get('q');
const mastheadInput = document.getElementById('masthead-q');
if (query && mastheadInput) mastheadInput.value = query;

// Arriving from a search, the way back is those results — not the job board.
// The search URL carries ?q= (see above), so the referrer is the exact result
// list the reader clicked out of; without it the link stays "← All jobs".
const back = document.querySelector('.story-return a');
if (back && document.referrer) {
  try {
    const from = new URL(document.referrer);
    if (from.origin === location.origin && from.pathname === '/search/' && from.searchParams.get('q')) {
      back.href = from.pathname + from.search;
      back.textContent = '← Back to search results';
    }
  } catch {
    /* a referrer we can't parse just leaves the default link alone */
  }
}
