import test from 'node:test';
import assert from 'node:assert/strict';
import jobPostingPlugin, { jobPosting } from '../plugins/job-posting/index.js';

const ctx = { siteUrl: 'https://angjobs.com', validDays: 60 };
const job = (title, firstLine) => ({
  title,
  date: '2026-09-01',
  url: '/jobs/x/',
  body: `${firstLine}\n\nMore about the role.\n[[form:apply]]`,
  content: `<p>${firstLine}</p>\n<p>More about the role.\n[[form:apply]]</p>`,
});

test('an onsite single role gets a located posting with salary and type', () => {
  const p = jobPosting(job('Valstad : Senior Robotics Engineer',
    'Valstad - Senior Robotics Engineer - Austin, TX - Full-time, on-site - $165 - 210k + equity'), ctx);
  assert.equal(p['@type'], 'JobPosting');
  assert.equal(p.title, 'Senior Robotics Engineer');
  assert.equal(p.hiringOrganization.name, 'Valstad');
  assert.equal(p.validThrough, '2026-10-31');
  assert.deepEqual(p.jobLocation[0].address, { '@type': 'PostalAddress', addressLocality: 'Austin', addressRegion: 'TX', addressCountry: 'US' });
  assert.equal(p.employmentType, 'FULL_TIME');
  assert.deepEqual(p.baseSalary.value, { '@type': 'QuantitativeValue', minValue: 165000, maxValue: 210000, unitText: 'YEAR' });
  assert.doesNotMatch(p.description, /form:apply/);
});

test('a remote role names the eligible country', () => {
  const p = jobPosting(job('pganalyze : Marketing Manager', 'pganalyze - Marketing Manager - REMOTE (US) - Full-time'), ctx);
  assert.equal(p.jobLocationType, 'TELECOMMUTE');
  assert.deepEqual(p.applicantLocationRequirements, [{ '@type': 'Country', name: 'US' }]);
  assert.equal(p.jobLocation, undefined);
});

test('posts Google would reject are left unmarked', () => {
  // several roles on one page
  assert.equal(jobPosting(job('Checkly : Product Manager, Sales Engineer', 'Checkly - Product Manager, Sales Engineer - Berlin'), ctx), null);
  // remote with no country
  assert.equal(jobPosting(job('Acme : Backend Engineer', 'Acme - Backend Engineer - REMOTE'), ctx), null);
  // a location where the role belongs
  assert.equal(jobPosting(job('CoVar : Durham, NC', 'CoVar - Durham, NC - Full-time'), ctx), null);
  // no way to apply
  assert.equal(jobPosting({ ...job('Acme : Backend Engineer', 'Acme - Backend Engineer - London'), body: 'x', content: '<p>x</p>' }, ctx), null);
});

test('renderPage injects escaped JSON-LD only on job pages', () => {
  const site = { config: { site: { url: 'https://angjobs.com/' } } };
  const page = { ...job('Acme : Backend Engineer', 'Acme - Backend Engineer - London </script>'), collection: 'jobs' };
  const html = jobPostingPlugin.renderPage(page, '<head></head>', site, {});
  assert.match(html, /<script type="application\/ld\+json">\{/);
  assert.equal(html.match(/<\/script>/g).length, 1); // post text can't close the tag
  assert.equal(jobPostingPlugin.renderPage({ ...page, collection: 'pages' }, '<head></head>', site, {}), undefined);
});
