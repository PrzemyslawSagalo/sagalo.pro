import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { register } from 'node:module';
import { z } from 'astro/zod';

const loaderCode = `
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'astro:content') {
    return {
      url: 'data:text/javascript,' + encodeURIComponent('export function defineCollection(c) { return c; }'),
      shortCircuit: true,
      format: 'module',
    };
  }
  return nextResolve(specifier, context);
}
`;
register('data:text/javascript,' + encodeURIComponent(loaderCode), { parentURL: import.meta.url });

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Test 1: docsSchema with extend accepts valid description, tags, difficulty, prerequisites, lastReviewed, and llmContext', async () => {
  const contentConfigPath = path.join(projectRoot, 'src/content.config.ts');
  assert.ok(fs.existsSync(contentConfigPath), 'src/content.config.ts must exist');

  const contentConfigSource = fs.readFileSync(contentConfigPath, 'utf8');
  assert.match(contentConfigSource, /description:\s*z\.string\(\)\.optional\(\)/, 'Must include description in schema');
  assert.match(contentConfigSource, /tags:\s*z\.array\(z\.string\(\)\)\.default\(\[\]\)/, 'Must include tags with [] default');
  assert.match(contentConfigSource, /difficulty:\s*z\.enum\(\['introductory',\s*'intermediate',\s*'advanced'\]\)\.optional\(\)/, 'Must include difficulty enum');
  assert.match(contentConfigSource, /prerequisites:\s*z\.array\(z\.string\(\)\)\.default\(\[\]\)/, 'Must include prerequisites with [] default');
  assert.match(contentConfigSource, /lastReviewed:\s*z\.coerce\.date\(\)\.optional\(\)/, 'Must include lastReviewed as coerced date');
  assert.match(contentConfigSource, /llmContext:\s*z\.string\(\)\.optional\(\)/, 'Must include llmContext');

  const { collections } = await import(`file://${contentConfigPath}`);
  assert.ok(collections && collections.docs, 'collections.docs must be defined');
  const schemaFn = collections.docs.schema;
  assert.equal(typeof schemaFn, 'function', 'schema must be a function');

  const schema = schemaFn({ image: () => z.string() });
  const validData = {
    title: 'Distributed Consensus',
    description: 'An architectural deep dive into Raft consensus',
    tags: ['distributed-systems', 'consensus', 'raft'],
    difficulty: 'advanced',
    prerequisites: ['networking-basics', 'state-machines'],
    lastReviewed: '2026-10-21',
    llmContext: 'Technical deep dive into Raft leader election and log replication',
  };

  const parsed = schema.safeParse(validData);
  assert.equal(parsed.success, true, 'valid data should pass validation');
  assert.equal(parsed.data.title, 'Distributed Consensus');
  assert.equal(parsed.data.description, 'An architectural deep dive into Raft consensus');
  assert.deepEqual(parsed.data.tags, ['distributed-systems', 'consensus', 'raft']);
  assert.equal(parsed.data.difficulty, 'advanced');
  assert.deepEqual(parsed.data.prerequisites, ['networking-basics', 'state-machines']);
  assert.ok(parsed.data.lastReviewed instanceof Date, 'lastReviewed must be coerced to Date');
  assert.equal(parsed.data.lastReviewed.toISOString().slice(0, 10), '2026-10-21');
  assert.equal(parsed.data.llmContext, 'Technical deep dive into Raft leader election and log replication');

  // Verify invalid difficulty fails
  const invalidData = {
    title: 'Invalid',
    difficulty: 'expert',
  };
  const invalidParsed = schema.safeParse(invalidData);
  assert.equal(invalidParsed.success, false, 'invalid difficulty enum must fail');
});

test('Test 2: Default values for tags and prerequisites fallback to [] when omitted', async () => {
  const contentConfigPath = path.join(projectRoot, 'src/content.config.ts');
  const { collections } = await import(`file://${contentConfigPath}`);
  const schemaFn = collections.docs.schema;
  const schema = schemaFn({ image: () => z.string() });

  const minimalData = {
    title: 'Minimal Doc Page',
  };

  const parsed = schema.safeParse(minimalData);
  assert.equal(parsed.success, true, 'minimal document should pass validation');
  assert.deepEqual(parsed.data.tags, [], 'tags should default to empty array');
  assert.deepEqual(parsed.data.prerequisites, [], 'prerequisites should default to empty array');
  assert.equal(parsed.data.description, undefined);
  assert.equal(parsed.data.difficulty, undefined);
  assert.equal(parsed.data.lastReviewed, undefined);
  assert.equal(parsed.data.llmContext, undefined);
});

test('Test 3: astro.config.mjs source content configures lastUpdated: true and editLink baseUrl', () => {
  const configPath = path.join(projectRoot, 'astro.config.mjs');
  assert.ok(fs.existsSync(configPath), 'astro.config.mjs must exist');

  const content = fs.readFileSync(configPath, 'utf8');
  assert.match(content, /lastUpdated:\s*true/, 'astro.config.mjs must configure lastUpdated: true');
  assert.match(
    content,
    /editLink:\s*\{\s*baseUrl:\s*['"]https:\/\/github\.com\/przemyslawsagalo\/sagalo\.pro\/edit\/main\/['"],?\s*\}/,
    'astro.config.mjs must configure editLink baseUrl'
  );
});
