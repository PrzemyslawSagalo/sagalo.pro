import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const astroConfigPath = path.join(projectRoot, 'astro.config.mjs');
const robotsPath = path.join(projectRoot, 'public/robots.txt');

test('Test 1: astro.config.mjs imports @astrojs/sitemap and registers sitemap() in integrations array', () => {
  const content = fs.readFileSync(astroConfigPath, 'utf8');

  assert.match(
    content,
    /import\s+sitemap\s+from\s+['"]@astrojs\/sitemap['"];?/,
    'astro.config.mjs must import sitemap from "@astrojs/sitemap"'
  );

  assert.match(
    content,
    /integrations:\s*\[[\s\S]*?\bsitemap\(\)[\s\S]*?\]/,
    'astro.config.mjs must register sitemap() inside the integrations array'
  );
});

test('Test 2: public/robots.txt declares Sitemap: https://sagalo.pro/sitemap-index.xml', () => {
  assert.ok(fs.existsSync(robotsPath), 'public/robots.txt must exist');
  const content = fs.readFileSync(robotsPath, 'utf8');

  assert.match(
    content,
    /^Sitemap:\s*https:\/\/sagalo\.pro\/sitemap-index\.xml$/m,
    'public/robots.txt must declare Sitemap pointing to https://sagalo.pro/sitemap-index.xml'
  );
});

test('Test 3: astro.config.mjs retains site: "https://sagalo.pro" and trailingSlash: "always"', () => {
  const content = fs.readFileSync(astroConfigPath, 'utf8');

  assert.match(
    content,
    /site:\s*['"]https:\/\/sagalo\.pro['"]/,
    'astro.config.mjs must configure site: "https://sagalo.pro"'
  );

  assert.match(
    content,
    /trailingSlash:\s*['"]always['"]/,
    'astro.config.mjs must configure trailingSlash: "always"'
  );
});
