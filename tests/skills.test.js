// tests/skills.test.js — the agent skills in .claude/skills/ (cms-spec.md §8.4).
//
// The skills are how an AI agent opening this repo in a terminal learns to write
// a post, run the site, and extend it. They are documentation, so nothing else
// fails when they rot: this test is the smoke alarm. It checks that each skill
// is well-formed, that every repo path and npm script it names still exists,
// and that each one ends at the same verification gate the humans use.
//
// Frontmatter is parsed with the CMS's own parser, so a skill header must stay
// inside the same deliberate subset every content file uses.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../lib/content.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skillsDir = path.join(root, '.claude', 'skills');

/** Paths a skill names as an example — the shape of a thing, never a real file. */
const PLACEHOLDERS = new Set([
  'plugins/my-plugin',      // the shape of a plugin folder, not a real one
  'themes/custom',          // what a user copies themes/default/ to
]);

// Only engine-owned roots are checked. content/, data/ and media/ hold user
// files that a real site is free to delete, and this test ships into every site
// made from this template — it must never fail because someone removed the
// sample content the docs happen to mention.
const ROOTS = ['lib', 'admin', 'tools', 'plugins', 'themes', 'migrations', '.github', '.claude'];
const ROOT_FILES = new Set(['build.js', 'package.json', 'site.config.json',
  'config.defaults.json', 'engine.json', 'CLAUDE.md', 'cms-spec.md', 'README.md']);

const skills = fs.readdirSync(skillsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const file = path.join(skillsDir, entry.name, 'SKILL.md');
    return { dir: entry.name, file, source: fs.readFileSync(file, 'utf8') };
  });

/** Inline `code spans`, with fenced blocks removed first (those hold commands). */
function codeSpans(markdown) {
  const prose = markdown.replace(/```[\s\S]*?```/g, '');
  return [...prose.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]);
}

test('there is at least one skill, and each is a folder with a SKILL.md', () => {
  assert.ok(skills.length > 0, '.claude/skills/ must contain at least one skill');
  for (const skill of skills) assert.ok(fs.existsSync(skill.file), `${skill.dir}/SKILL.md is missing`);
});

test('every skill header parses, names its own folder, and describes itself', () => {
  for (const { dir, file, source } of skills) {
    const { data } = parseFrontmatter(source, path.relative(root, file));
    assert.equal(data.name, dir, `${file}: "name" must match the folder name`);
    assert.ok(typeof data.description === 'string' && data.description.length > 40,
      `${file}: "description" decides when the skill loads — make it specific about the tasks it covers`);
    // Descriptions sit in every session's context; keep them one dense sentence.
    assert.ok(data.description.length <= 500, `${file}: "description" is too long (${data.description.length} chars, max 500)`);
  }
});

test('skills only cross-reference skills that exist', () => {
  const names = new Set(skills.map((s) => s.dir));
  for (const { file, source } of skills) {
    for (const span of codeSpans(source)) {
      if (/^plain-[a-z-]+$/.test(span)) {
        assert.ok(names.has(span), `${file}: references the skill "${span}", which does not exist`);
      }
    }
  }
});

test('every repo path a skill names still exists', () => {
  for (const { file, source } of skills) {
    for (const span of codeSpans(source)) {
      const candidate = span.replace(/\/$/, '');
      if (/[<>*…\s]/.test(candidate) || candidate.startsWith('/')) continue;  // placeholder, command, or a site URL
      const [head] = candidate.split('/');
      const looksLikeRepoPath = ROOTS.includes(head) || (ROOT_FILES.has(candidate) && !candidate.includes('/'));
      if (!looksLikeRepoPath || PLACEHOLDERS.has(candidate)) continue;
      assert.ok(fs.existsSync(path.join(root, candidate)),
        `${file}: names "${candidate}", which is not in the repo — fix the path or add it to PLACEHOLDERS`);
    }
  }
});

test('every npm script a skill names is defined in package.json', () => {
  const { scripts } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  for (const { file, source } of skills) {
    for (const [, name] of source.matchAll(/npm run ([\w:-]+)/g)) {
      assert.ok(name in scripts, `${file}: "npm run ${name}" is not a script in package.json`);
    }
  }
});

test('every skill ends at the same verification gate', () => {
  for (const { file, source } of skills) {
    assert.ok(source.includes('node --test tests/') && source.includes('node build.js'),
      `${file}: must tell the agent to run both "node --test tests/" and "node build.js" before committing`);
  }
});

test('the shipped permission allowlist is valid and read-only-ish', () => {
  const settings = JSON.parse(fs.readFileSync(path.join(root, '.claude', 'settings.json'), 'utf8'));
  const allow = settings.permissions?.allow;
  assert.ok(Array.isArray(allow) && allow.length > 0, '.claude/settings.json must have permissions.allow');
  // Publishing is the user's call, never a pre-approved one.
  for (const rule of allow) {
    assert.doesNotMatch(rule, /git (commit|push|add)|rm |curl /,
      `.claude/settings.json pre-approves "${rule}" — the allowlist is for inspecting and building, not for publishing or deleting`);
  }
});
