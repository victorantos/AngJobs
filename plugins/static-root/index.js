import fs from 'node:fs';
import path from 'node:path';

// Some files must live at the domain root with an exact name the site's URL
// patterns can't produce — search-engine verification files (google….html),
// .well-known/, etc. Drop them in static/ and this copies them into dist/
// verbatim after every build. The build runs from the repo root, so the
// folder is resolved from the working directory (site doesn't expose root).
export default {
  afterBuild(distPath, site, options) {
    const dir = path.resolve(process.cwd(), options.dir || 'static');
    if (!fs.existsSync(dir)) return;
    fs.cpSync(dir, distPath, { recursive: true });
  },
};
