const express = require('express');
const fs = require('fs');
const path = require('path');

// A job URL, current or legacy: /jobs/<month>-<year>-<slug>/,
// /jobs/<Month>-<year>/[<name>.html], or a month tag /jobs/tag/<month>-<year>/.
// List pagination and anything else under /jobs/ doesn't match.
const JOB_PATH = /^\/jobs\/(?:tag\/)?(?:january|february|march|april|may|june|july|august|september|october|november|december)-\d{4}(?:[-\/].*)?$/i;

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';

// www → apex 301
app.use((req, res, next) => {
  const host = req.headers.host || '';
  if (host.startsWith('www.')) {
    const naked = host.replace(/^www\./, '');
    res.writeHead(301, { Location: `https://${naked}${req.url}` });
    return res.end();
  }
  next();
});

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Moved and removed URLs. The build writes _redirects for hosts that honour
// it; Express doesn't, so without this every old URL got a 200 meta-refresh
// page (or a plain 404) instead of a real status code.
//
// A removed job is 410 Gone, never a redirect: pointing expired postings at
// /jobs/ reads as a soft 404 to Google, and 410 drops the URL from the index
// fastest. The import rotation redirects rotated-out jobs to /jobs/, so those
// entries are treated as gone rather than moved.
const redirects = new Map();
const gone = new Set();
try {
  const lines = fs.readFileSync(path.join(__dirname, '_redirects'), 'utf8').split('\n');
  for (const line of lines) {
    const m = line.trim().match(/^(\S+)\s+(\S+)\s+\d{3}$/);
    if (!m) continue;
    const [, from, to] = m;
    if (to === '/jobs/' && JOB_PATH.test(from)) gone.add(from);
    else redirects.set(from, to);
  }
} catch {
  // No _redirects in this build — nothing to map.
}

app.use((req, res, next) => {
  let p;
  try { p = decodeURIComponent(req.path); } catch { p = req.path; }
  const to = redirects.get(p) || redirects.get(req.path);
  if (to) return res.redirect(301, to);
  if (gone.has(p) || gone.has(req.path)) return sendGone(res);
  next();
});

// Static files
app.use(express.static(__dirname, {
  extensions: ['html'],
  setHeaders: (res, filepath) => {
    if (/\.(?:js|css)$/.test(filepath)) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Anything job-shaped that isn't on disk is a posting (or a month) that has
// rotated out — including the old site's /jobs/April-2026/<name>.html pages.
// Everything else is an ordinary 404.
app.use((req, res) => {
  if (JOB_PATH.test(req.path)) return sendGone(res);
  sendErrorPage(res, 404);
});

function sendGone(res) {
  sendErrorPage(res, 410);
}

function sendErrorPage(res, status) {
  const fallback = path.join(__dirname, '404.html');
  res.status(status).sendFile(fallback, err => {
    if (err) res.status(status).send(status === 410 ? 'Gone' : 'Not Found');
  });
}

app.listen(PORT, HOST, () => {
  console.log(`AngJobs running at http://${HOST}:${PORT}`);
});
