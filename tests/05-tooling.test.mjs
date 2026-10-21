import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Makefile contains help, lint, verify, build, serve, preview, and test targets', () => {
  const makefilePath = path.join(projectRoot, 'Makefile');
  assert.ok(fs.existsSync(makefilePath), 'Makefile must exist');

  const content = fs.readFileSync(makefilePath, 'utf8');

  // Verify PHONY targets
  assert.match(
    content,
    /\.PHONY:\s*help\s+lint\s+verify\s+build\s+serve\s+preview\s+test/,
    'Makefile should define all required .PHONY targets including preview'
  );

  // Verify target definitions
  assert.match(content, /^help:/m, 'Makefile must define help target');
  assert.match(content, /^lint:/m, 'Makefile must define lint target');
  assert.match(content, /^verify:/m, 'Makefile must define verify target');
  assert.match(content, /^build:/m, 'Makefile must define build target');
  assert.match(content, /^serve:/m, 'Makefile must define serve target');
  assert.match(content, /^preview:/m, 'Makefile must define preview target');
  assert.match(content, /^test:/m, 'Makefile must define test target');

  // Verify target commands
  assert.match(content, /verify:\s*\n\s+npx astro check/, 'verify must run npx astro check');
  assert.match(content, /build:\s*\n\s+npm run build/, 'build must run npm run build');
  assert.match(content, /serve:\s*\n\s+npm run dev/, 'serve must run npm run dev');
  assert.match(content, /preview:\s*\n\s+npm run preview/, 'preview must run npm run preview');
  assert.match(content, /test:\s*lint\s+verify\s+build/, 'test must depend on lint, verify, build');
});

test('.github/workflows/ci.yml contains Node 22 LTS setup, npm ci, npx astro check, and npm run build, plus pre-commit lint', () => {
  const ciPath = path.join(projectRoot, '.github', 'workflows', 'ci.yml');
  assert.ok(fs.existsSync(ciPath), '.github/workflows/ci.yml must exist');

  const content = fs.readFileSync(ciPath, 'utf8');

  // Check pre-commit lint
  assert.match(content, /uses:\s*actions\/setup-python@v\d+/);
  assert.match(content, /pre-commit run --all-files/);

  // Check Node 22 LTS setup and npm commands
  assert.match(content, /uses:\s*actions\/setup-node@v\d+/);
  assert.match(content, /node-version:\s*['"]?22['"]?/);
  assert.match(content, /cache:\s*['"]npm['"]/);
  assert.match(content, /run:\s*npm ci/);
  assert.match(content, /run:\s*npx astro check/);
  assert.match(content, /run:\s*npm run build/);

  // Ensure hugo and go setup are removed
  assert.doesNotMatch(content, /actions-hugo/, 'Hugo actions must be removed from ci.yml');
  assert.doesNotMatch(content, /setup-go/, 'Go setup must be removed from ci.yml');
});

test('.github/workflows/deploy.yaml triggers on push to main/master and workflow_dispatch, builds with Node 22, uploads ./dist, and deploys pages', () => {
  const deployPath = path.join(projectRoot, '.github', 'workflows', 'deploy.yaml');
  assert.ok(fs.existsSync(deployPath), '.github/workflows/deploy.yaml must exist');

  const content = fs.readFileSync(deployPath, 'utf8');

  // Check triggers
  assert.match(content, /push:\s*\n\s+branches:\s*\n\s+-\s*main\s*\n\s+-\s*master/);
  assert.match(content, /workflow_dispatch:/);

  // Check permissions
  assert.match(content, /pages:\s*write/);
  assert.match(content, /id-token:\s*write/);

  // Check Node 22 setup & build
  assert.match(content, /uses:\s*actions\/setup-node@v\d+/);
  assert.match(content, /node-version:\s*['"]?22['"]?/);
  assert.match(content, /run:\s*npm ci/);
  assert.match(content, /run:\s*npm run build/);

  // Check upload pages artifact with ./dist
  assert.match(content, /uses:\s*actions\/upload-pages-artifact@v\d+/);
  assert.match(content, /path:\s*\.?\/dist/);

  // Check deploy pages
  assert.match(content, /uses:\s*actions\/deploy-pages@v\d+/);

  // Ensure hugo and go setup are removed
  assert.doesNotMatch(content, /actions-hugo/, 'Hugo actions must not be in deploy.yaml');
  assert.doesNotMatch(content, /setup-go/, 'Go setup must not be in deploy.yaml');
});

test('Legacy .github/workflows/hugo.yaml is deleted', () => {
  const hugoWorkflowPath = path.join(projectRoot, '.github', 'workflows', 'hugo.yaml');
  assert.ok(!fs.existsSync(hugoWorkflowPath), '.github/workflows/hugo.yaml must be deleted');
});
