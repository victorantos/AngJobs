/**
 * job-posting — emits schema.org JobPosting JSON-LD on job pages so they can
 * appear in Google for Jobs.
 *
 * Jobs are imported HN "Who is hiring?" comments, so company, role, location
 * and salary only exist in the post's free-text first line:
 *
 *   DAT - Engineering Manager - Seattle, WA - Hybrid - Full-time - $192k - $261k
 *
 * Google treats wrong or policy-breaking markup worse than none (manual
 * actions, invalid-item errors), so this parser is deliberately conservative:
 * a page gets markup only when the post names ONE role and at least one
 * country we can state with confidence. Everything else is left unmarked.
 */

const US_STATES = new Set('AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC'.split(' '));

/** City (as written in posts) → [locality, region, ISO country]. */
const CITIES = [
  ['San Francisco', 'San Francisco', 'CA', 'US'], ['SF Bay Area', 'San Francisco', 'CA', 'US'],
  ['Bay Area', 'San Francisco', 'CA', 'US'], ['SF', 'San Francisco', 'CA', 'US'],
  ['New York City', 'New York', 'NY', 'US'], ['New York', 'New York', 'NY', 'US'], ['NYC', 'New York', 'NY', 'US'],
  ['Palo Alto', 'Palo Alto', 'CA', 'US'], ['Mountain View', 'Mountain View', 'CA', 'US'],
  ['Menlo Park', 'Menlo Park', 'CA', 'US'], ['Redwood City', 'Redwood City', 'CA', 'US'],
  ['San Jose', 'San Jose', 'CA', 'US'], ['San Mateo', 'San Mateo', 'CA', 'US'], ['Oakland', 'Oakland', 'CA', 'US'],
  ['Los Angeles', 'Los Angeles', 'CA', 'US'], ['San Diego', 'San Diego', 'CA', 'US'],
  ['Seattle', 'Seattle', 'WA', 'US'], ['Boston', 'Boston', 'MA', 'US'], ['Chicago', 'Chicago', 'IL', 'US'],
  ['Austin', 'Austin', 'TX', 'US'], ['Denver', 'Denver', 'CO', 'US'], ['Atlanta', 'Atlanta', 'GA', 'US'],
  ['Miami', 'Miami', 'FL', 'US'], ['Pittsburgh', 'Pittsburgh', 'PA', 'US'], ['Philadelphia', 'Philadelphia', 'PA', 'US'],
  ['Washington DC', 'Washington', 'DC', 'US'], ['Salt Lake City', 'Salt Lake City', 'UT', 'US'],
  ['London', 'London', null, 'GB'], ['Berlin', 'Berlin', null, 'DE'], ['Munich', 'Munich', null, 'DE'],
  ['Hamburg', 'Hamburg', null, 'DE'], ['Paris', 'Paris', null, 'FR'], ['Amsterdam', 'Amsterdam', null, 'NL'],
  ['Zurich', 'Zurich', null, 'CH'], ['Zürich', 'Zurich', null, 'CH'], ['Stockholm', 'Stockholm', null, 'SE'],
  ['Copenhagen', 'Copenhagen', null, 'DK'], ['Oslo', 'Oslo', null, 'NO'], ['Helsinki', 'Helsinki', null, 'FI'],
  ['Dublin', 'Dublin', null, 'IE'], ['Barcelona', 'Barcelona', null, 'ES'], ['Madrid', 'Madrid', null, 'ES'],
  ['Lisbon', 'Lisbon', null, 'PT'], ['Vienna', 'Vienna', null, 'AT'], ['Prague', 'Prague', null, 'CZ'],
  ['Warsaw', 'Warsaw', null, 'PL'], ['Toronto', 'Toronto', 'ON', 'CA'], ['Vancouver', 'Vancouver', 'BC', 'CA'],
  ['Montreal', 'Montreal', 'QC', 'CA'], ['Tel Aviv', 'Tel Aviv', null, 'IL'], ['Singapore', 'Singapore', null, 'SG'],
  ['Tokyo', 'Tokyo', null, 'JP'], ['Sydney', 'Sydney', 'NSW', 'AU'], ['Melbourne', 'Melbourne', 'VIC', 'AU'],
  ['Bangalore', 'Bengaluru', null, 'IN'], ['Bengaluru', 'Bengaluru', null, 'IN'],
];

/** Country words that may qualify a remote role → ISO code. */
const COUNTRIES = [
  [/\b(?:US|USA|U\.S\.A?\.?|United States)\b/, 'US'], [/\bCanada\b/i, 'CA'], [/\b(?:UK|United Kingdom)\b/, 'GB'],
  [/\bGermany\b/i, 'DE'], [/\bFrance\b/i, 'FR'], [/\bNetherlands\b/i, 'NL'], [/\bSpain\b/i, 'ES'],
  [/\bPortugal\b/i, 'PT'], [/\bIreland\b/i, 'IE'], [/\bSwitzerland\b/i, 'CH'], [/\bSweden\b/i, 'SE'],
  [/\bPoland\b/i, 'PL'], [/\bItaly\b/i, 'IT'], [/\bIndia\b/i, 'IN'], [/\bAustralia\b/i, 'AU'],
  [/\bIsrael\b/i, 'IL'], [/\bJapan\b/i, 'JP'], [/\bBrazil\b/i, 'BR'], [/\bMexico\b/i, 'MX'],
];

/** A role must name a job — HN titles also yield teams, domains and fragments. */
const JOB_WORD = /\b(?:engineer|developer|scientist|manager|designer|analyst|researcher|architect|lead|director|officer|cto|head|intern|staff|specialist|administrator|technician|trainer|recruiter|writer|consultant|sre|devops|bdr|sdr|representative|executive|associate|coordinator|chief|founder|co-?founder|programmer|accountant|advocate)\b/i;

/** A role segment that lists several jobs — Google allows one posting per page. */
const MULTIPLE = /,|;|&|\/|\+| and | or |\bmultiple\b|\bvarious\b|\broles\b|\bpositions\b|\bopenings\b|\bengineers\b|\bdevelopers\b|\bhiring\b/i;

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Decode the handful of entities HN emits and drop tags. */
function plainText(html) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#x2F;/gi, '/').replace(/&#x27;/gi, "'").replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim();
}

/** @returns {Array<{locality: string, region: string|null, country: string}>} */
function findPlaces(line) {
  const places = [];
  const seen = new Set();
  const add = (locality, region, country) => {
    const key = `${locality}|${country}`;
    if (!seen.has(key)) { seen.add(key); places.push({ locality, region, country }); }
  };
  for (const m of line.matchAll(/\b([A-Z][A-Za-z.]*(?: [A-Z][A-Za-z.]*){0,2}),\s*([A-Z]{2})\b/g)) {
    if (!US_STATES.has(m[2]) || /^[A-Z]{2,3}$/.test(m[1]) && !CITIES.some(([name]) => name === m[1])) continue;
    const known = CITIES.find(([name]) => name === m[1]);
    add(known ? known[1] : m[1], m[2], 'US');
  }
  for (const [name, locality, region, country] of CITIES) {
    if (new RegExp(`(?:^|[^A-Za-z])${escapeRe(name)}(?![A-Za-z])`).test(line)) {
      // "SF" inside "SF Bay Area" etc. — the longer, earlier entry already won.
      if (![...seen].some((k) => k.startsWith(`${locality}|`))) add(locality, region, country);
    }
  }
  return places;
}

function employmentType(line) {
  const types = [];
  if (/\bfull[- ]?time\b/i.test(line)) types.push('FULL_TIME');
  if (/\bpart[- ]?time\b/i.test(line)) types.push('PART_TIME');
  if (/\bcontract(?:or)?\b/i.test(line)) types.push('CONTRACTOR');
  if (/\bintern(?:ship)?\b/i.test(line)) types.push('INTERN');
  return types;
}

/** "$150k - $200k" / "€70-90k" / "£85,000" → MonetaryAmount; anything odder → null. */
function salary(line) {
  const cur = { '$': 'USD', '€': 'EUR', '£': 'GBP' };
  const num = (n, k) => Math.round(Number(n.replace(/,/g, '')) * (k ? 1000 : 1));
  const m = line.match(/([$€£])\s?(\d{2,3}(?:,\d{3})?)(k)?\s*(?:-|–|to)\s*[$€£]?\s?(\d{2,3}(?:,\d{3})?)(k)?/i);
  if (!m || /\bCAD\b|\bAUD\b|\bSGD\b/.test(line)) return null;
  const min = num(m[2], m[3] || m[5]);
  const max = num(m[4], m[5]);
  if (min < 10000 || max < min) return null; // hourly/daily rates or garbled ranges
  return {
    '@type': 'MonetaryAmount',
    currency: cur[m[1]],
    value: { '@type': 'QuantitativeValue', minValue: min, maxValue: max, unitText: 'YEAR' },
  };
}

/**
 * Build the JobPosting object for one job, or null when the post can't be
 * marked up honestly.
 * @param {object} page job item: title ("Company : Role"), date, body, content, url
 * @param {{siteUrl: string, validDays: number}} ctx
 */
export function jobPosting(page, { siteUrl, validDays }) {
  const parts = String(page.title || '').split(' : ').map((s) => s.replace(/[*_]/g, '').trim());
  if (parts.length !== 2 || !page.date || !page.content) return null;
  const [company, role] = parts;
  if (!company || !role) return null;
  // The importer sometimes puts a location or job type where the role belongs.
  const notARole = /\bremote\b|\bonsite\b|\bon-site\b|\bhybrid\b|\bin-office\b|\bdays\b|\bfull[- ]?time\b|\bpart[- ]?time\b|\bcontract\b|\binterns?hip\b|https?:|www\.|\$|€|£/i;
  const looksLikePlace = (s) => findPlaces(s).length || COUNTRIES.some(([re]) => re.test(s));
  if (!JOB_WORD.test(role) || /\w\.(?:com|io|ai|co|gg|dev|org|net)\b/i.test(role)) return null;
  if (MULTIPLE.test(role.replace(/\([^)]*\)/g, '')) || notARole.test(role) || looksLikePlace(role)) return null;
  if (notARole.test(company) || looksLikePlace(company) || company.length > 60 || / is /.test(company)) return null;
  if (!/\[\[form:apply\]\]/.test(page.body || '') && !/<form\b/.test(page.content)) return null;

  const firstLine = plainText(String(page.body || '').split('\n').find((l) => l.trim()) || '');
  const remote = /\bremote\b/i.test(firstLine) && !/\bno remote\b|\bnot remote\b/i.test(firstLine);
  const places = findPlaces(firstLine);

  const posting = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: role,
    description: page.content.replace(/\[\[form:[\w-]+\]\]/g, '').replace(/<form\b[\s\S]*?<\/form>/g, ''),
    datePosted: page.date,
    validThrough: addDays(page.date, validDays),
    hiringOrganization: { '@type': 'Organization', name: company },
    url: siteUrl + page.url,
  };

  if (places.length) {
    posting.jobLocation = places.map((p) => ({
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: p.locality,
        ...(p.region ? { addressRegion: p.region } : {}),
        addressCountry: p.country,
      },
    }));
  }
  if (remote) {
    // Only fully remote posts are TELECOMMUTE; "hybrid" keeps its office.
    const countries = [...new Set(COUNTRIES.filter(([re]) => re.test(firstLine)).map(([, c]) => c))];
    if (/\bhybrid\b/i.test(firstLine) && places.length) {
      // an office role that allows some remote days — the office is the location
    } else if (countries.length) {
      posting.jobLocationType = 'TELECOMMUTE';
      posting.applicantLocationRequirements = countries.map((c) => ({ '@type': 'Country', name: c }));
    } else if (!places.length) {
      return null; // "Remote" with no country — Google requires one
    } else {
      posting.jobLocationType = 'TELECOMMUTE'; // country defaults to the jobLocation's
    }
  }
  if (!posting.jobLocation && !posting.applicantLocationRequirements) return null;

  const types = employmentType(firstLine);
  if (types.length) posting.employmentType = types.length === 1 ? types[0] : types;
  const pay = salary(firstLine);
  if (pay) posting.baseSalary = pay;
  return posting;
}

function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default {
  renderPage(page, html, site, options) {
    if (page.collection !== (options.collection || 'jobs')) return;
    const posting = jobPosting(page, {
      siteUrl: String(site.config.site.url || '').replace(/\/$/, ''),
      validDays: Number(options.validDays) || 90,
    });
    if (!posting) return;
    // "<" escaped so post text can never close the script element.
    const json = JSON.stringify(posting).replace(/</g, '\\u003c');
    return html.replace('</head>', `<script type="application/ld+json">${json}</script>\n</head>`);
  },
};
