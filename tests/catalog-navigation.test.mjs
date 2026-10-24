import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'yaml';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = path.join(projectRoot, 'src/content/docs');

function extractFrontmatter(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error(`Missing frontmatter in ${filePath}`);
  return yaml.parse(match[1]);
}

test('Test 1: runbooks/index.mdx has sidebar.order: 0 and links to /runbooks/git/workflows/', () => {
  const filePath = path.join(docsDir, 'runbooks/index.mdx');
  assert.ok(fs.existsSync(filePath), 'runbooks/index.mdx must exist');

  const fm = extractFrontmatter(filePath);
  assert.equal(fm.sidebar?.order, 0, 'runbooks/index.mdx must have sidebar.order: 0');

  const content = fs.readFileSync(filePath, 'utf8');
  assert.match(
    content,
    /href=['"]\/runbooks\/git\/workflows\/['"]/,
    'runbooks/index.mdx must link to /runbooks/git/workflows/'
  );
  assert.equal(
    content.includes('href="/runbooks/git/"'),
    false,
    'Must not link to broken /runbooks/git/'
  );
});

test('Test 2: deep-dives/index.mdx has sidebar.order: 0', () => {
  const filePath = path.join(docsDir, 'deep-dives/index.mdx');
  assert.ok(fs.existsSync(filePath), 'deep-dives/index.mdx must exist');

  const fm = extractFrontmatter(filePath);
  assert.equal(fm.sidebar?.order, 0, 'deep-dives/index.mdx must have sidebar.order: 0');
});

test('Test 3: deep-dives/python/index.mdx exists with sidebar.order: 0 and contains <CardGrid> linking to child deep dives', () => {
  const mdxPath = path.join(docsDir, 'deep-dives/python/index.mdx');
  const mdPath = path.join(docsDir, 'deep-dives/python/index.md');

  assert.ok(fs.existsSync(mdxPath), 'deep-dives/python/index.mdx must exist');
  assert.equal(fs.existsSync(mdPath), false, 'deep-dives/python/index.md must be converted/removed');

  const fm = extractFrontmatter(mdxPath);
  assert.equal(fm.sidebar?.order, 0, 'deep-dives/python/index.mdx must have sidebar.order: 0');

  const content = fs.readFileSync(mdxPath, 'utf8');
  assert.ok(content.includes('<CardGrid>'), 'Must contain <CardGrid>');
  assert.ok(content.includes('href="/deep-dives/python/concurrency/"'), 'Must link to concurrency');
  assert.ok(content.includes('href="/deep-dives/python/environments/"'), 'Must link to environments');
  assert.ok(content.includes('href="/deep-dives/python/functions/"'), 'Must link to functions');
  assert.ok(content.includes('href="/deep-dives/python/tests/"'), 'Must link to tests');
});

test('Test 4: runbooks/git/index.mdx exists with sidebar.order: 0 and contains <CardGrid> linking to child runbooks', () => {
  const mdxPath = path.join(docsDir, 'runbooks/git/index.mdx');
  const mdPath = path.join(docsDir, 'runbooks/git/index.md');

  assert.ok(fs.existsSync(mdxPath), 'runbooks/git/index.mdx must exist');
  assert.equal(fs.existsSync(mdPath), false, 'runbooks/git/index.md must be converted/removed');

  const fm = extractFrontmatter(mdxPath);
  assert.equal(fm.sidebar?.order, 0, 'runbooks/git/index.mdx must have sidebar.order: 0');

  const content = fs.readFileSync(mdxPath, 'utf8');
  assert.ok(content.includes('<CardGrid>'), 'Must contain <CardGrid>');
  assert.ok(content.includes('href="/runbooks/git/workflows/"'), 'Must link to workflows');
  assert.ok(content.includes('href="/runbooks/git/cheat-sheet/"'), 'Must link to cheat-sheet');
});

test('Test 5: Zero occurrences of > [!TIP] or > [!NOTE] across content files', () => {
  const filesToCheck = [
    path.join(docsDir, 'runbooks/git/cheat-sheet.md'),
    path.join(docsDir, 'runbooks/containers.mdx'),
    path.join(docsDir, 'deep-dives/python/environments.md'),
    path.join(docsDir, 'runbooks/linux.md'),
  ];

  for (const filePath of filesToCheck) {
    const content = fs.readFileSync(filePath, 'utf8');
    assert.equal(
      />\s*\[!(TIP|NOTE)\]/i.test(content),
      false,
      `${path.basename(filePath)} must not contain GitHub blockquote callout syntax`
    );
  }
});
