import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = path.join(projectRoot, 'src/content/docs');
const contentDir = path.join(projectRoot, 'content');
const layoutsDir = path.join(projectRoot, 'layouts');

const expectedFiles = [
  'index.mdx',
  'deep-dives/index.mdx',
  'deep-dives/standards.mdx',
  'deep-dives/python/index.mdx',
  'deep-dives/python/concurrency.md',
  'deep-dives/python/environments.md',
  'deep-dives/python/functions.md',
  'deep-dives/python/tests.md',
  'runbooks/index.mdx',
  'runbooks/ai-coding-assistants.md',
  'runbooks/containers.mdx',
  'runbooks/daily-toolkit.md',
  'runbooks/linux.md',
  'runbooks/sql.md',
  'runbooks/vim.md',
  'runbooks/git/index.mdx',
  'runbooks/git/cheat-sheet.md',
  'runbooks/git/workflows.mdx',
];

function getAllFiles(dir, base = '') {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const relPath = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files = files.concat(getAllFiles(path.join(dir, entry.name), relPath));
    } else {
      files.push(relPath);
    }
  }
  return files;
}

test('Test 1: src/content/docs/index.mdx exists with template: splash, hero: { title: "" }, and imports HeroBanner, FeatureGrid, FeatureCard', () => {
  const indexMdxPath = path.join(docsDir, 'index.mdx');
  assert.ok(fs.existsSync(indexMdxPath), 'src/content/docs/index.mdx must exist');

  const content = fs.readFileSync(indexMdxPath, 'utf8');
  assert.match(content, /template:\s*splash/, 'index.mdx must configure template: splash');
  assert.match(content, /hero:\s*\n\s*title:\s*["']?["']?/, 'index.mdx must configure hero: { title: "" }');
  assert.match(content, /import\s+HeroBanner\s+from\s+['"]\.\.\/\.\.\/components\/HeroBanner\.astro['"]/, 'index.mdx must import HeroBanner');
  assert.match(content, /import\s+FeatureGrid\s+from\s+['"]\.\.\/\.\.\/components\/FeatureGrid\.astro['"]/, 'index.mdx must import FeatureGrid');
  assert.match(content, /import\s+FeatureCard\s+from\s+['"]\.\.\/\.\.\/components\/FeatureCard\.astro['"]/, 'index.mdx must import FeatureCard');
  assert.match(content, /<HeroBanner\s*\/>/, 'index.mdx must render <HeroBanner />');
  assert.match(content, /<FeatureGrid[\s\S]*<\/FeatureGrid>/, 'index.mdx must render <FeatureGrid>');
  assert.match(content, /<FeatureCard[\s\S]*\/>/, 'index.mdx must render <FeatureCard />');
});

test('Test 2: All 18 documentation files exist under src/content/docs/ (1 index.mdx + 7 deep-dives + 10 runbooks)', () => {
  assert.ok(fs.existsSync(docsDir), 'src/content/docs/ directory must exist');
  const actualFiles = getAllFiles(docsDir).sort();

  for (const expected of expectedFiles) {
    assert.ok(
      actualFiles.includes(expected),
      `Expected file ${expected} not found in src/content/docs/`
    );
  }

  assert.strictEqual(
    actualFiles.length,
    18,
    `Expected exactly 18 files under src/content/docs/, found ${actualFiles.length}: ${actualFiles.join(', ')}`
  );
});

test('Test 3: Section root files are renamed from _index.md to index.md', () => {
  assert.ok(fs.existsSync(docsDir), 'src/content/docs/ directory must exist');
  const allDocsFiles = getAllFiles(docsDir);

  const underscoreIndexFiles = allDocsFiles.filter(f => f.endsWith('_index.md'));
  assert.strictEqual(
    underscoreIndexFiles.length,
    0,
    `No _index.md files should exist in src/content/docs/, but found: ${underscoreIndexFiles.join(', ')}`
  );

  const sectionRoots = [
    'deep-dives/index.mdx',
    'deep-dives/python/index.mdx',
    'runbooks/index.mdx',
    'runbooks/git/index.mdx',
  ];

  for (const root of sectionRoots) {
    assert.ok(
      fs.existsSync(path.join(docsDir, root)),
      `Section root file ${root} must exist as index.md or index.mdx`
    );
  }
});

test('Test 4: Frontmatter conversion: weight: N is mapped to sidebar: { order: N }', () => {
  assert.ok(fs.existsSync(docsDir), 'src/content/docs/ directory must exist');

  const filesToCheck = [
    { file: 'runbooks/vim.md', expectedOrder: 2 },
    { file: 'runbooks/ai-coding-assistants.md', expectedOrder: 1 },
    { file: 'runbooks/containers.mdx', expectedOrder: 4 },
    { file: 'runbooks/linux.md', expectedOrder: 5 },
    { file: 'runbooks/sql.md', expectedOrder: 6 },
    { file: 'runbooks/daily-toolkit.md', expectedOrder: 7 },
    { file: 'runbooks/git/cheat-sheet.md', expectedOrder: 1 },
    { file: 'runbooks/git/workflows.mdx', expectedOrder: 2 },
    { file: 'runbooks/git/index.mdx', expectedOrder: 0 },
    { file: 'runbooks/index.mdx', expectedOrder: 0 },
    { file: 'deep-dives/index.mdx', expectedOrder: 0 },
    { file: 'deep-dives/standards.mdx', expectedOrder: 2 },
    { file: 'deep-dives/python/index.mdx', expectedOrder: 0 },
    { file: 'deep-dives/python/concurrency.md', expectedOrder: 1 },
    { file: 'deep-dives/python/functions.md', expectedOrder: 2 },
    { file: 'deep-dives/python/tests.md', expectedOrder: 3 },
    { file: 'deep-dives/python/environments.md', expectedOrder: 4 },
  ];

  for (const { file, expectedOrder } of filesToCheck) {
    const filePath = path.join(docsDir, file);
    assert.ok(fs.existsSync(filePath), `${file} must exist`);
    const content = fs.readFileSync(filePath, 'utf8');

    // Must not contain top-level weight: N
    assert.doesNotMatch(content, /^weight:\s*\d+/m, `${file} must not contain raw weight: frontmatter`);

    // Must contain sidebar order: N (either multi-line or inline object)
    const hasSidebarOrder =
      /sidebar:\s*\n\s*order:\s*(\d+)/.test(content) ||
      /sidebar:\s*\{\s*order:\s*(\d+)\s*\}/.test(content);

    assert.ok(hasSidebarOrder, `${file} must configure sidebar order`);

    const orderMatch =
      content.match(/sidebar:\s*\n\s*order:\s*(\d+)/) ||
      content.match(/sidebar:\s*\{\s*order:\s*(\d+)\s*\}/);

    assert.strictEqual(
      Number(orderMatch[1]),
      expectedOrder,
      `${file} sidebar order must be ${expectedOrder}, got ${orderMatch[1]}`
    );
  }
});

test('Test 5: Hugo-specific attributes (type: docs, cascade) and raw Hugo shortcodes ({{< ... >}}) are completely eliminated', () => {
  assert.ok(fs.existsSync(docsDir), 'src/content/docs/ directory must exist');
  const allDocsFiles = getAllFiles(docsDir);

  for (const relFile of allDocsFiles) {
    const fullPath = path.join(docsDir, relFile);
    const content = fs.readFileSync(fullPath, 'utf8');

    // Check Hugo frontmatter attributes
    assert.doesNotMatch(
      content,
      /^type:\s*docs\s*$/m,
      `${relFile} must not contain 'type: docs'`
    );
    assert.doesNotMatch(
      content,
      /^cascade:\s*$/m,
      `${relFile} must not contain 'cascade:'`
    );

    // Check raw Hugo shortcodes
    assert.doesNotMatch(
      content,
      /\{\{<\s*.*\s*>\}\}/,
      `${relFile} must not contain raw Hugo shortcodes {{< ... >}}`
    );
    assert.doesNotMatch(
      content,
      /\{\{%\s*.*\s*%\}\}/,
      `${relFile} must not contain raw Hugo shortcodes {{% ... %}}`
    );
  }
});

test('Test 6: Legacy content/ and layouts/ directories are removed', () => {
  assert.strictEqual(
    fs.existsSync(contentDir),
    false,
    'Legacy content/ directory must be completely removed'
  );
  assert.strictEqual(
    fs.existsSync(layoutsDir),
    false,
    'Legacy layouts/ directory must be completely removed'
  );
});
