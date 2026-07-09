// Fixture plugin: touches every hook so the golden test covers the runner.

import fs from 'node:fs';
import path from 'node:path';

export default {
  init(site) {
    if (!site.config.site.title) throw new Error('init ran before config?');
  },
  transformContent(item) {
    item.words = item.body.split(/\s+/).filter(Boolean).length;
  },
  renderPage(page, html, site, options) {
    return html.replace('</head>', `<meta name="stamp" content="${options.note}">\n</head>`);
  },
  afterBuild(distPath, site, options) {
    fs.writeFileSync(path.join(distPath, 'stamp.txt'), `stamped ${Object.keys(site.collections).join(',')} ${options.unchanged}\n`);
  },
};
