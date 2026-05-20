const express = require('express');
const path = require('path');

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

// Static files
app.use(express.static(__dirname, {
  extensions: ['html'],
  setHeaders: (res, filepath) => {
    if (/\.(?:js|css)$/.test(filepath)) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// 404
app.use((req, res) => {
  const fallback = path.join(__dirname, '404.html');
  res.status(404).sendFile(fallback, err => {
    if (err) res.status(404).send('Not Found');
  });
});

app.listen(PORT, HOST, () => {
  console.log(`AngJobs running at http://${HOST}:${PORT}`);
});
