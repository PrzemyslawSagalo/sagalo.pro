import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

test('Defect 1: package.json must declare yaml and @astrojs/sitemap in devDependencies', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  const devDeps = pkg.devDependencies || {};
  assert.ok(devDeps.yaml, 'yaml must be explicitly declared in devDependencies');
  assert.ok(devDeps['@astrojs/sitemap'], '@astrojs/sitemap must be declared in devDependencies');
});

test('Defect 2: .github/dependabot.yml must monitor npm ecosystem, not gomod', () => {
  const dependabotConfig = fs.readFileSync(path.join(rootDir, '.github/dependabot.yml'), 'utf8');
  assert.ok(!dependabotConfig.includes('package-ecosystem: "gomod"'), 'gomod ecosystem must be removed');
  assert.ok(dependabotConfig.includes('package-ecosystem: "npm"'), 'npm ecosystem must be monitored');
});

test('Defect 3: .github/workflows/ci.yml must execute npm test', () => {
  const ciConfig = fs.readFileSync(path.join(rootDir, '.github/workflows/ci.yml'), 'utf8');
  assert.match(ciConfig, /run:\s*npm test/, 'ci.yml must include a step running npm test');
});

test('Defect 4: Makefile must execute npm test in test target', () => {
  const makefile = fs.readFileSync(path.join(rootDir, 'Makefile'), 'utf8');
  assert.match(makefile, /npm test/, 'Makefile test target must execute npm test');
});

test('Defect 5: astro.config.mjs must register @astrojs/sitemap', () => {
  const astroConfig = fs.readFileSync(path.join(rootDir, 'astro.config.mjs'), 'utf8');
  assert.match(astroConfig, /import sitemap from '@astrojs\/sitemap';/, 'Must import sitemap');
  assert.match(astroConfig, /sitemap\(\)/, 'Must include sitemap() in integrations');
});
