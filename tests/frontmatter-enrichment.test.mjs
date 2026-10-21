import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'yaml';
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
const docsDir = path.join(projectRoot, 'src/content/docs');

function extractFrontmatter(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    throw new Error(`Frontmatter delimiters not found in ${filePath}`);
  }
  return yaml.parse(match[1]);
}

async function getDocsSchema() {
  const contentConfigPath = path.join(projectRoot, 'src/content.config.ts');
  const { collections } = await import(`file://${contentConfigPath}`);
  return collections.docs.schema({ image: () => z.string() });
}

test('Test 1: Verify all 7 Deep Dives documents contain non-empty description string and non-empty tags array', async () => {
  const deepDivesFiles = [
    'deep-dives/index.md',
    'deep-dives/standards.md',
    'deep-dives/python/index.md',
    'deep-dives/python/concurrency.md',
    'deep-dives/python/environments.md',
    'deep-dives/python/functions.md',
    'deep-dives/python/tests.md',
  ];

  const schema = await getDocsSchema();

  assert.equal(deepDivesFiles.length, 7, 'Must test exactly 7 Deep Dives documents');

  for (const relPath of deepDivesFiles) {
    const fullPath = fs.existsSync(path.join(docsDir, relPath))
      ? path.join(docsDir, relPath)
      : path.join(docsDir, relPath.replace(/\.md$/, '.mdx'));
    assert.ok(fs.existsSync(fullPath), `Document must exist: ${relPath} (or .mdx)`);

    const data = extractFrontmatter(fullPath);

    // Verify description is non-empty string
    assert.equal(typeof data.description, 'string', `${relPath} must have a string description`);
    assert.ok(data.description.trim().length > 0, `${relPath} description must not be empty`);

    // Verify tags is non-empty array
    assert.ok(Array.isArray(data.tags), `${relPath} tags must be an array`);
    assert.ok(data.tags.length > 0, `${relPath} tags array must not be empty`);
    for (const tag of data.tags) {
      assert.equal(typeof tag, 'string', `${relPath} tag items must be strings`);
      assert.ok(tag.trim().length > 0, `${relPath} tag must not be empty`);
    }

    // Verify schema safeParse passes
    const parsed = schema.safeParse(data);
    assert.equal(parsed.success, true, `${relPath} frontmatter must pass docsSchema: ${parsed.error}`);
  }
});

test('Test 2: Verify all 10 Runbooks documents contain non-empty description string and non-empty tags array', async () => {
  const runbooksFiles = [
    'runbooks/index.md',
    'runbooks/ai-coding-assistants.md',
    'runbooks/containers.md',
    'runbooks/daily-toolkit.md',
    'runbooks/linux.md',
    'runbooks/sql.md',
    'runbooks/vim.md',
    'runbooks/git/index.md',
    'runbooks/git/cheat-sheet.md',
    'runbooks/git/workflows.md',
  ];

  const schema = await getDocsSchema();

  assert.equal(runbooksFiles.length, 10, 'Must test exactly 10 Runbooks documents');

  for (const relPath of runbooksFiles) {
    const fullPath = fs.existsSync(path.join(docsDir, relPath))
      ? path.join(docsDir, relPath)
      : path.join(docsDir, relPath.replace(/\.md$/, '.mdx'));
    assert.ok(fs.existsSync(fullPath), `Document must exist: ${relPath} (or .mdx)`);

    const data = extractFrontmatter(fullPath);

    // Verify description is non-empty string
    assert.equal(typeof data.description, 'string', `${relPath} must have a string description`);
    assert.ok(data.description.trim().length > 0, `${relPath} description must not be empty`);

    // Verify tags is non-empty array
    assert.ok(Array.isArray(data.tags), `${relPath} tags must be an array`);
    assert.ok(data.tags.length > 0, `${relPath} tags array must not be empty`);
    for (const tag of data.tags) {
      assert.equal(typeof tag, 'string', `${relPath} tag items must be strings`);
      assert.ok(tag.trim().length > 0, `${relPath} tag must not be empty`);
    }

    // Verify schema safeParse passes
    const parsed = schema.safeParse(data);
    assert.equal(parsed.success, true, `${relPath} frontmatter must pass docsSchema: ${parsed.error}`);
  }
});

test('Test 3: Verify the 4 Python deep-dive documents exist at deep-dives/python/{concurrency,environments,functions,tests}.md and parse cleanly without duplicate index paths', async () => {
  const pythonDocNames = ['concurrency.md', 'environments.md', 'functions.md', 'tests.md'];
  const pythonDir = path.join(docsDir, 'deep-dives/python');

  assert.ok(fs.existsSync(pythonDir), 'deep-dives/python directory must exist');

  const schema = await getDocsSchema();
  const seenPaths = new Set();

  for (const docName of pythonDocNames) {
    const docPath = path.join(pythonDir, docName);
    assert.ok(fs.existsSync(docPath), `${docName} must exist in deep-dives/python/`);

    // Ensure not duplicate of index
    assert.notEqual(docName, 'index.md', `${docName} must not be named index.md`);
    assert.ok(!seenPaths.has(docName), `Path ${docName} must not be duplicate`);
    seenPaths.add(docName);

    const data = extractFrontmatter(docPath);
    assert.ok(data.title, `${docName} must have a title`);
    assert.equal(typeof data.description, 'string', `${docName} must have description`);
    assert.ok(Array.isArray(data.tags) && data.tags.length > 0, `${docName} must have non-empty tags`);

    const parsed = schema.safeParse(data);
    assert.equal(parsed.success, true, `${docName} must parse cleanly with docsSchema`);
  }

  // Also verify index.md exists and is separate from the 4 docs
  const indexPath = path.join(pythonDir, 'index.md');
  assert.ok(fs.existsSync(indexPath), 'deep-dives/python/index.md must exist as the catalog index');
  assert.ok(!seenPaths.has('index.md'), 'index.md must not collide with deep dive doc names');
});
