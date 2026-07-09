// Regenerate the golden files for tests/build.test.js:
//   node tests/update-goldens.js
// Review `git diff tests/fixtures/expected/` before committing.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../build.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const expectedDir = path.join(here, 'fixtures', 'expected');

fs.rmSync(expectedDir, { recursive: true, force: true });
await build({ root: path.join(here, 'fixtures', 'site'), outDir: expectedDir });
console.log(`goldens written to ${path.relative(process.cwd(), expectedDir)} — review the diff before committing`);
