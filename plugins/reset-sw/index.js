import fs from 'node:fs';
import path from 'node:path';

// A previous CMS's service worker can outlive it: once a browser registers one,
// it keeps serving that worker's cached pages offline-first, so visitors see the
// old site even after you migrate — a classic trap when leaving a Jekyll/Chirpy
// PWA. This plugin publishes a self-destruct worker at the SAME path(s) the old
// one used. On its next update check a stale browser fetches this, unregisters
// the worker, wipes its caches, and reloads to the fresh site. New visitors
// never register it (nothing on a plain site calls register()), so it only ever
// affects browsers that already had the old one. List your old paths in
// options.paths (the Chirpy default is sw.min.js).
const KILL = `self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil((async () => {
  for (const key of await caches.keys()) await caches.delete(key);
  await self.registration.unregister();
  for (const client of await self.clients.matchAll()) client.navigate(client.url);
})()));
`;

export default {
  afterBuild(distPath, site, options) {
    for (const name of options.paths || ['sw.min.js', 'sw.js', 'service-worker.js']) {
      fs.writeFileSync(path.join(distPath, name), KILL);
    }
  },
};
