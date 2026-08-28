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
// with JavaScript off. The search plugin builds that page's input when its own
// module runs (after this one), so wait for load, then hand it the ?q= query —
// deep links like /search/?q=rust run the search on arrival.
const query = new URLSearchParams(location.search).get('q');
if (query) {
  const runSearch = () => {
    const masthead = document.getElementById('masthead-q');
    if (masthead) masthead.value = query;
    const input = document.querySelector('#search-app input[type="search"]');
    if (!input) return;
    input.value = query;
    input.dispatchEvent(new Event('input'));
  };
  if (document.readyState === 'complete') runSearch();
  else window.addEventListener('load', runSearch);
}
