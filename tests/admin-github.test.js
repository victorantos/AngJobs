// tests/admin-github.test.js — the admin's optimistic-concurrency helper
// (admin/js/github.js `updateFile`). It read-modify-writes a file in one commit
// and, on a 409 ("edited elsewhere"), re-reads the FRESH file and re-applies the
// change — so an unrelated concurrent edit (e.g. a plugin just enabled) is
// preserved, never clobbered, and the user never dead-ends. `io` is injected so
// the retry logic is tested with no network or browser globals.

import test from 'node:test';
import assert from 'node:assert/strict';
import { updateFile } from '../admin/js/github.js';

class HttpError extends Error {
  constructor(status) { super(`HTTP ${status}`); this.status = status; }
}

test('updateFile writes the mutated content with the current sha', async () => {
  const puts = [];
  const io = {
    getFile: async () => ({ text: '{"a":1}', sha: 'sha1' }),
    putFile: async (path, content, message, sha) => { puts.push({ path, content, message, sha }); return { commitSha: 'c1' }; },
  };
  const res = await updateFile('f.json', (t) => t.replace('1', '2'), 'msg', { io });
  assert.equal(res.commitSha, 'c1');
  assert.equal(puts.length, 1);
  assert.deepEqual(puts[0], { path: 'f.json', content: '{"a":2}', message: 'msg', sha: 'sha1' });
});

test('updateFile writes nothing when mutate returns the same text', async () => {
  let puts = 0;
  const io = { getFile: async () => ({ text: 'same', sha: 's' }), putFile: async () => { puts++; return { commitSha: 'c' }; } };
  const res = await updateFile('f', (t) => t, 'msg', { io });
  assert.equal(puts, 0);
  assert.equal(res.commitSha, null);
  assert.equal(res.unchanged, true);
});

test('updateFile re-reads and re-applies on a 409 — concurrent change is preserved', async () => {
  // The file changed under us: first read has plugins:[], but by save time a
  // plugin was enabled (plugins:["search"], new sha). The stale write 409s; the
  // retry must read the FRESH config and re-apply the settings edit on top of it.
  const versions = [
    { text: JSON.stringify({ site: { title: 'Old' }, plugins: [] }), sha: 'v1' },
    { text: JSON.stringify({ site: { title: 'Old' }, plugins: ['search'] }), sha: 'v2' },
  ];
  let reads = 0, wrote = null;
  const io = {
    getFile: async () => versions[Math.min(reads++, versions.length - 1)],
    putFile: async (path, content, message, sha) => {
      if (sha === 'v1') throw new HttpError(409); // stale — rejected like the real API
      wrote = JSON.parse(content); return { commitSha: 'c2' };
    },
  };
  const res = await updateFile('site.config.json', (text) => {
    const cfg = JSON.parse(text);
    cfg.site.title = 'New';                       // the user's settings edit
    return JSON.stringify(cfg);
  }, 'settings: update site settings', { io });
  assert.equal(res.commitSha, 'c2');
  assert.equal(wrote.site.title, 'New');          // the edit landed
  assert.deepEqual(wrote.plugins, ['search']);    // the concurrent plugin survived
  assert.equal(reads, 2);                         // it re-read after the 409
});

test('updateFile gives up after the retry budget and rethrows the 409', async () => {
  let puts = 0;
  const io = { getFile: async () => ({ text: 'x', sha: 's' }), putFile: async () => { puts++; throw new HttpError(409); } };
  await assert.rejects(updateFile('f', () => 'y', 'm', { io, retries: 2 }), (e) => e.status === 409);
  assert.equal(puts, 3); // initial try + 2 retries
});

test('updateFile creates a file that does not exist yet (404 on read)', async () => {
  let wrote = null;
  const io = {
    getFile: async () => { throw new HttpError(404); },
    putFile: async (path, content, message, sha) => { wrote = { content, sha }; return { commitSha: 'c' }; },
  };
  const res = await updateFile('data/footer.json', (text) => (text == null ? '{"html":"hi"}' : text), 'footer', { io });
  assert.equal(res.commitSha, 'c');
  assert.equal(wrote.content, '{"html":"hi"}');
  assert.equal(wrote.sha, undefined); // created without a sha
});

test('updateFile does not create a missing file when mutate declines (returns null)', async () => {
  let puts = 0;
  const io = { getFile: async () => { throw new HttpError(404); }, putFile: async () => { puts++; return { commitSha: 'c' }; } };
  const res = await updateFile('data/footer.json', (text) => (text == null ? null : text), 'footer', { io });
  assert.equal(puts, 0);
  assert.equal(res.commitSha, null);
});
