// search plugin — browser part. Runs on every page but only acts on /search/.
// Fetches the prebuilt search-index.json and filters it as you type.

const root = document.getElementById('search-app');
if (root) {
  const options = JSON.parse(document.getElementById('plugin-options')?.textContent || '{}').search || {};
  const maxResults = options.maxResults || 8;
  // Works at the site root or under a subpath (GitHub project Pages): derive
  // the base from this module's own URL (…/plugins/search/client.js).
  const base = new URL('../../', import.meta.url).pathname.replace(/\/$/, '');

  const input = document.createElement('input');
  input.type = 'search';
  input.placeholder = 'Type to search…';
  input.setAttribute('aria-label', 'Search this site');
  const results = document.createElement('ul');
  results.className = 'search-results';
  root.append(input, results);
  input.focus();

  let index = null;
  const load = async () => {
    if (!index) index = await fetch(`${base}/search-index.json`).then((r) => r.json());
    return index;
  };

  /** Score one entry for a query: title beats tags beats body text. */
  function score(entry, terms) {
    let points = 0;
    for (const term of terms) {
      if (entry.title.toLowerCase().includes(term)) points += 10;
      else if (entry.tags.some((tag) => String(tag).toLowerCase().includes(term))) points += 5;
      else if (entry.description.toLowerCase().includes(term)) points += 3;
      else if (entry.text.toLowerCase().includes(term)) points += 1;
      else return 0; // every term must match somewhere
    }
    return points;
  }

  async function search() {
    const terms = input.value.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) { results.replaceChildren(); return; }
    const entries = (await load())
      .map((entry) => ({ entry, points: score(entry, terms) }))
      .filter((match) => match.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, maxResults);
    results.replaceChildren(...entries.map(({ entry }) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = base + entry.url;
      a.textContent = entry.title;
      const p = document.createElement('p');
      p.textContent = entry.description || entry.text.slice(0, 140);
      li.append(a, p);
      return li;
    }));
    if (!entries.length) {
      const li = document.createElement('li');
      li.className = 'search-empty';
      li.textContent = 'Nothing found — try fewer or different words.';
      results.append(li);
    }
  }

  let timer;
  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(search, 120); });
}
