import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'yaml';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ciWorkflowPath = path.join(projectRoot, '.github/workflows/ci.yml');
const makefilePath = path.join(projectRoot, 'Makefile');
const deployYmlPath = path.join(projectRoot, '.github/workflows/deploy.yml');
const deployYamlPath = path.join(projectRoot, '.github/workflows/deploy.yaml');

test('Test 1: .github/workflows/ci.yml contains Run test suite step running npm test in build-check job immediately after npm ci', () => {
  const ciContent = fs.readFileSync(ciWorkflowPath, 'utf8');
  const parsed = yaml.parse(ciContent);

  const buildCheckJob = parsed.jobs['build-check'];
  assert.ok(buildCheckJob, 'build-check job must exist in ci.yml');

  const steps = buildCheckJob.steps;
  const ciIndex = steps.findIndex((s) => s.run && s.run.trim() === 'npm ci');
  assert.ok(ciIndex !== -1, 'npm ci step must exist in build-check');

  const testStep = steps[ciIndex + 1];
  assert.ok(testStep, 'Step immediately following npm ci must exist');
  assert.equal(testStep.name, 'Run test suite', 'Step name must be "Run test suite"');
  assert.equal(testStep.run.trim(), 'npm test', 'Step must execute "npm test"');
});

test('Test 2: .github/workflows/ci.yml does not contain redundant npx astro check step in build-check job', () => {
  const ciContent = fs.readFileSync(ciWorkflowPath, 'utf8');
  const parsed = yaml.parse(ciContent);

  const buildCheckJob = parsed.jobs['build-check'];
  const hasAstroCheck = buildCheckJob.steps.some(
    (s) => s.run && s.run.includes('npx astro check')
  );
  assert.equal(hasAstroCheck, false, 'Redundant "npx astro check" must be removed from build-check job');
});

test('Test 3: Makefile contains npm-test in .PHONY and test: lint verify npm-test build', () => {
  const makefileContent = fs.readFileSync(makefilePath, 'utf8');

  assert.match(
    makefileContent,
    /^\.PHONY:.*npm-test/m,
    'Makefile .PHONY declaration must include npm-test'
  );

  assert.match(
    makefileContent,
    /^test:\s+lint\s+verify\s+npm-test\s+build/m,
    'Makefile test target must execute lint verify npm-test build'
  );

  assert.match(
    makefileContent,
    /^npm-test:\s*\n\t+npm\s+test/m,
    'Makefile must define npm-test target running npm test'
  );
});

test('Test 4: .github/workflows/deploy.yml exists, deploy.yaml does not exist, and top-level permissions restricts pages: write', () => {
  assert.ok(fs.existsSync(deployYmlPath), '.github/workflows/deploy.yml must exist');
  assert.equal(fs.existsSync(deployYamlPath), false, '.github/workflows/deploy.yaml must be removed/renamed');

  const deployContent = fs.readFileSync(deployYmlPath, 'utf8');
  const parsed = yaml.parse(deployContent);

  assert.equal(
    parsed.permissions?.['pages'],
    undefined,
    'Top-level permissions must NOT contain pages: write'
  );
  assert.equal(
    parsed.permissions?.['id-token'],
    undefined,
    'Top-level permissions must NOT contain id-token: write'
  );
  assert.equal(
    parsed.permissions?.contents,
    'read',
    'Top-level permissions must have contents: read'
  );

  const deployJob = parsed.jobs?.deploy;
  assert.ok(deployJob, 'deploy job must exist');
  assert.equal(deployJob.permissions?.['pages'], 'write', 'deploy job must have permissions.pages: write');
  assert.equal(deployJob.permissions?.['id-token'], 'write', 'deploy job must have permissions.id-token: write');
});
