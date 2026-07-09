// search plugin — build-time part: emit a themed /search/ page.
// The input and results are added by client.js (progressive enhancement);
// without JavaScript the page explains itself instead of breaking.

import fs from 'node:fs';
import path from 'node:path';

export default {
  afterBuild(distPath, site) {
    const html = site.renderPage('page', {
      page: {
        title: 'Search',
        url: '/search/',
        description: `Search ${site.config.site.title}`,
        content: '<div id="search-app"><noscript><p>Search needs JavaScript. You can also browse everything from the <a href="/">homepage</a>.</p></noscript></div>',
      },
    });
    fs.mkdirSync(path.join(distPath, 'search'), { recursive: true });
    fs.writeFileSync(path.join(distPath, 'search', 'index.html'), html);
  },
};
