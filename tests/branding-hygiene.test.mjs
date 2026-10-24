import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const faviconPath = path.join(projectRoot, 'public/favicon.svg');
const astroConfigPath = path.join(projectRoot, 'astro.config.mjs');
const markdownlintPath = path.join(projectRoot, '.markdownlint.yaml');
const gitignorePath = path.join(projectRoot, '.gitignore');

test('Test 1: public/favicon.svg exists and is a valid SVG document with viewBox="0 0 32 32"', () => {
  assert.ok(fs.existsSync(faviconPath), 'public/favicon.svg must exist');
  const content = fs.readFileSync(faviconPath, 'utf8');

  assert.match(content, /<svg[^>]*\bviewBox=['"]0 0 32 32['"]/i, 'favicon.svg must define viewBox="0 0 32 32"');
  assert.ok(content.includes('</svg>'), 'favicon.svg must be a closed SVG element');
});

test('Test 2: astro.config.mjs configures favicon: "/favicon.svg" in Starlight options', () => {
  const content = fs.readFileSync(astroConfigPath, 'utf8');

  assert.match(
    content,
    /favicon:\s*['"]\/favicon\.svg['"]/,
    'astro.config.mjs must configure favicon: "/favicon.svg"'
  );
});

test('Test 3: .markdownlint.yaml contains zero occurrences of "Hugo" or "hugo"', () => {
  const content = fs.readFileSync(markdownlintPath, 'utf8');

  assert.equal(
    /hugo/i.test(content),
    false,
    '.markdownlint.yaml must not contain legacy Hugo generator references'
  );
});

test('Test 4: .gitignore preserves Python cache ignore rules', () => {
  const content = fs.readFileSync(gitignorePath, 'utf8');

  assert.ok(content.includes('__pycache__/'), '.gitignore must retain __pycache__/');
  assert.ok(content.includes('*.py[cod]'), '.gitignore must retain *.py[cod]');
});
