import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readmePath = path.join(projectRoot, 'README.md');

test('Test 1: README.md documents Astro, Starlight, and personal knowledge hub positioning with zero legacy Hugo/Go references', () => {
  assert.ok(fs.existsSync(readmePath), 'README.md must exist');
  const content = fs.readFileSync(readmePath, 'utf8');

  // Verify modern architecture & positioning
  assert.match(content, /Astro/i, 'README.md must document Astro');
  assert.match(content, /Starlight/i, 'README.md must document Starlight');
  assert.match(content, /Knowledge Hub/i, 'README.md must document Personal Knowledge Hub positioning');

  // Verify zero legacy Hugo / Go / Hextra references
  assert.doesNotMatch(content, /hugo/i, 'README.md must contain zero references to Hugo');
  assert.doesNotMatch(content, /hextra/i, 'README.md must contain zero references to Hextra');
  assert.doesNotMatch(content, /hugo\.yaml/i, 'README.md must contain zero references to hugo.yaml');
  assert.doesNotMatch(content, /go\.mod|go modules|golang/i, 'README.md must contain zero references to Go modules');
});

test('Test 2: README.md documents LLM endpoints, Node >= 20 / npm workflows, and deploy badge', () => {
  assert.ok(fs.existsSync(readmePath), 'README.md must exist');
  const content = fs.readFileSync(readmePath, 'utf8');

  // Verify machine-readable LLM endpoints
  assert.match(content, /\/llms\.txt/, 'README.md must document /llms.txt');
  assert.match(content, /\/llms-full\.txt/, 'README.md must document /llms-full.txt');

  // Verify Node >= 20 and development prerequisites
  assert.match(content, /Node(\.js)?.*>=?\s*20/i, 'README.md must document Node >= 20 prerequisite');
  assert.match(content, /pre-commit/, 'README.md must document pre-commit');

  // Verify npm workflow commands
  assert.match(content, /npm install/, 'README.md must document npm install');
  assert.match(content, /npm run dev/, 'README.md must document npm run dev');
  assert.match(content, /npm run build/, 'README.md must document npm run build');
  assert.match(content, /npm test/, 'README.md must document npm test');
  assert.match(content, /npx astro check/, 'README.md must document npx astro check');

  // Verify GitHub Pages deploy badge
  assert.match(content, /deploy\.yml\/badge\.svg/, 'README.md must include deploy.yml badge');
  assert.match(content, /actions\/workflows\/deploy\.yml/, 'README.md must link to deploy.yml workflow');
});
