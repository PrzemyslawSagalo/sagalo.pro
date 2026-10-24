import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'yaml';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJsonPath = path.join(projectRoot, 'package.json');
const dependabotPath = path.join(projectRoot, '.github/dependabot.yml');

test('Test 1: package.json declares @astrojs/sitemap, yaml, @fontsource-variable/inter, typescript, @astrojs/check in devDependencies', () => {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const devDeps = pkg.devDependencies || {};

  const requiredDevDeps = [
    '@astrojs/sitemap',
    'yaml',
    '@fontsource-variable/inter',
    'typescript',
    '@astrojs/check',
  ];

  for (const dep of requiredDevDeps) {
    assert.ok(
      dep in devDeps,
      `Expected "${dep}" to be present in devDependencies of package.json`
    );
  }
});

test('Test 2: package.json does NOT have @fontsource/inter, typescript, or @astrojs/check in production dependencies', () => {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const deps = pkg.dependencies || {};

  const disallowedDeps = [
    '@fontsource/inter',
    'typescript',
    '@astrojs/check',
  ];

  for (const dep of disallowedDeps) {
    assert.ok(
      !(dep in deps),
      `Disallowed "${dep}" found in production dependencies of package.json`
    );
  }
});

test('Test 3: .github/dependabot.yml contains package-ecosystem: "npm" for directory "/" on a weekly schedule', () => {
  const content = fs.readFileSync(dependabotPath, 'utf8');
  const parsed = yaml.parse(content);

  assert.ok(Array.isArray(parsed.updates), 'Dependabot config must have an "updates" array');

  const npmUpdate = parsed.updates.find(
    (u) => u['package-ecosystem'] === 'npm'
  );

  assert.ok(npmUpdate, 'Dependabot config must contain an update configuration for "npm"');
  assert.equal(npmUpdate.directory, '/', 'Directory for npm ecosystem must be "/"');
  assert.equal(
    npmUpdate.schedule?.interval,
    'weekly',
    'Schedule interval for npm ecosystem must be "weekly"'
  );
});

test('Test 4: .github/dependabot.yml contains zero occurrences of "gomod"', () => {
  const content = fs.readFileSync(dependabotPath, 'utf8');
  assert.equal(
    content.includes('gomod'),
    false,
    '.github/dependabot.yml must not contain "gomod"'
  );
});
