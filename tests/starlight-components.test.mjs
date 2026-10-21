import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = path.join(projectRoot, 'src/content/docs');

test('Test 1: Verify deep-dives/standards.mdx exists (and .md is gone), imports <FileTree>, contains <FileTree>, and contains :::tip and :::danger asides', () => {
  const mdxPath = path.join(docsDir, 'deep-dives/standards.mdx');
  const mdPath = path.join(docsDir, 'deep-dives/standards.md');

  assert.ok(fs.existsSync(mdxPath), 'src/content/docs/deep-dives/standards.mdx must exist');
  assert.ok(!fs.existsSync(mdPath), 'src/content/docs/deep-dives/standards.md must not exist');

  const content = fs.readFileSync(mdxPath, 'utf8');

  // Verify FileTree import
  assert.match(
    content,
    /import\s*\{\s*FileTree\s*\}\s*from\s*['"]@astrojs\/starlight\/components['"]/,
    'standards.mdx must import FileTree from @astrojs/starlight/components'
  );

  // Verify FileTree usage
  assert.match(
    content,
    /<FileTree>[\s\S]*?<\/FileTree>/,
    'standards.mdx must contain <FileTree> component'
  );

  // Verify FileTree directory structure items
  assert.match(content, /- src\//, 'FileTree must include src/');
  assert.match(content, /- components\//, 'FileTree must include components/');
  assert.match(content, /FeatureCard\.astro/, 'FileTree must include FeatureCard.astro');
  assert.match(content, /LlmContextCard\.astro/, 'FileTree must include LlmContextCard.astro');
  assert.match(content, /custom\.css/, 'FileTree must include custom.css');
  assert.match(content, /astro\.config\.mjs/, 'FileTree must include astro.config.mjs');
  assert.match(content, /package\.json/, 'FileTree must include package.json');

  // Verify asides
  assert.match(
    content,
    /:::tip\[Standard:\s*Inversion of Control\][\s\S]*?:::/,
    'standards.mdx must contain :::tip[Standard: Inversion of Control] aside'
  );
  assert.match(
    content,
    /:::danger\[Anti-Pattern:\s*Untyped Global Context\][\s\S]*?:::/,
    'standards.mdx must contain :::danger[Anti-Pattern: Untyped Global Context] aside'
  );
});

test('Test 2: Verify runbooks/containers.mdx exists (and .md is gone), imports <Tabs>, <TabItem>, <Steps>, contains <Tabs>, <Steps>, and contains :::caution aside', () => {
  const mdxPath = path.join(docsDir, 'runbooks/containers.mdx');
  const mdPath = path.join(docsDir, 'runbooks/containers.md');

  assert.ok(fs.existsSync(mdxPath), 'src/content/docs/runbooks/containers.mdx must exist');
  assert.ok(!fs.existsSync(mdPath), 'src/content/docs/runbooks/containers.md must not exist');

  const content = fs.readFileSync(mdxPath, 'utf8');

  // Verify component imports
  assert.match(
    content,
    /import\s*\{[^}]*Tabs[^}]*\}\s*from\s*['"]@astrojs\/starlight\/components['"]/,
    'containers.mdx must import Tabs from @astrojs/starlight/components'
  );
  assert.match(
    content,
    /import\s*\{[^}]*TabItem[^}]*\}\s*from\s*['"]@astrojs\/starlight\/components['"]/,
    'containers.mdx must import TabItem from @astrojs/starlight/components'
  );
  assert.match(
    content,
    /import\s*\{[^}]*Steps[^}]*\}\s*from\s*['"]@astrojs\/starlight\/components['"]/,
    'containers.mdx must import Steps from @astrojs/starlight/components'
  );

  // Verify Tabs and TabItems
  assert.match(
    content,
    /<Tabs>[\s\S]*?<\/Tabs>/,
    'containers.mdx must contain <Tabs> component'
  );
  assert.match(
    content,
    /<TabItem\s+label=["']Docker["']>/,
    'containers.mdx must contain <TabItem label="Docker">'
  );
  assert.match(
    content,
    /<TabItem\s+label=["']Podman["']>/,
    'containers.mdx must contain <TabItem label="Podman">'
  );

  // Verify Steps usage
  assert.match(
    content,
    /<Steps>[\s\S]*?<\/Steps>/,
    'containers.mdx must contain <Steps> component'
  );

  // Verify caution aside
  assert.match(
    content,
    /:::caution\[Rootless Container Execution\][\s\S]*?:::/,
    'containers.mdx must contain :::caution[Rootless Container Execution] aside'
  );
});

test('Test 3: Verify runbooks/git/workflows.mdx exists (and .md is gone), imports <Tabs>, <TabItem>, <Steps>, and uses <Steps>', () => {
  const mdxPath = path.join(docsDir, 'runbooks/git/workflows.mdx');
  const mdPath = path.join(docsDir, 'runbooks/git/workflows.md');

  assert.ok(fs.existsSync(mdxPath), 'src/content/docs/runbooks/git/workflows.mdx must exist');
  assert.ok(!fs.existsSync(mdPath), 'src/content/docs/runbooks/git/workflows.md must not exist');

  const content = fs.readFileSync(mdxPath, 'utf8');

  // Verify component imports
  assert.match(
    content,
    /import\s*\{[^}]*Tabs[^}]*\}\s*from\s*['"]@astrojs\/starlight\/components['"]/,
    'workflows.mdx must import Tabs from @astrojs/starlight/components'
  );
  assert.match(
    content,
    /import\s*\{[^}]*TabItem[^}]*\}\s*from\s*['"]@astrojs\/starlight\/components['"]/,
    'workflows.mdx must import TabItem from @astrojs/starlight/components'
  );
  assert.match(
    content,
    /import\s*\{[^}]*Steps[^}]*\}\s*from\s*['"]@astrojs\/starlight\/components['"]/,
    'workflows.mdx must import Steps from @astrojs/starlight/components'
  );

  // Verify Steps usage
  assert.match(
    content,
    /<Steps>[\s\S]*?<\/Steps>/,
    'workflows.mdx must use <Steps> component'
  );

  // Verify Tabs usage
  assert.match(
    content,
    /<Tabs>[\s\S]*?<\/Tabs>/,
    'workflows.mdx must use <Tabs> component'
  );
});

test('Test 4: Verify deep-dives/index.mdx and runbooks/index.mdx exist (and .md are gone), import <CardGrid> and <LinkCard>, and contain <CardGrid> and <LinkCard> components', () => {
  const ddMdxPath = path.join(docsDir, 'deep-dives/index.mdx');
  const ddMdPath = path.join(docsDir, 'deep-dives/index.md');
  const rbMdxPath = path.join(docsDir, 'runbooks/index.mdx');
  const rbMdPath = path.join(docsDir, 'runbooks/index.md');

  assert.ok(fs.existsSync(ddMdxPath), 'deep-dives/index.mdx must exist');
  assert.ok(!fs.existsSync(ddMdPath), 'deep-dives/index.md must not exist');
  assert.ok(fs.existsSync(rbMdxPath), 'runbooks/index.mdx must exist');
  assert.ok(!fs.existsSync(rbMdPath), 'runbooks/index.md must not exist');

  const ddContent = fs.readFileSync(ddMdxPath, 'utf8');
  const rbContent = fs.readFileSync(rbMdxPath, 'utf8');

  // Verify deep-dives imports and usage
  assert.match(
    ddContent,
    /import\s*\{[^}]*CardGrid[^}]*\}\s*from\s*['"]@astrojs\/starlight\/components['"]/,
    'deep-dives/index.mdx must import CardGrid'
  );
  assert.match(
    ddContent,
    /import\s*\{[^}]*LinkCard[^}]*\}\s*from\s*['"]@astrojs\/starlight\/components['"]/,
    'deep-dives/index.mdx must import LinkCard'
  );
  assert.match(
    ddContent,
    /<CardGrid>[\s\S]*?<\/CardGrid>/,
    'deep-dives/index.mdx must render <CardGrid>'
  );
  assert.match(
    ddContent,
    /<LinkCard[^>]*href=["']\/deep-dives\/standards\/["']/,
    'deep-dives/index.mdx must link to /deep-dives/standards/'
  );
  assert.match(
    ddContent,
    /<LinkCard[^>]*href=["']\/deep-dives\/python\/["']/,
    'deep-dives/index.mdx must link to /deep-dives/python/'
  );
  assert.match(
    ddContent,
    /## Architecture & Deep Dives Catalog[\s\S]*?## Project Kick-off Checklist/,
    'deep-dives/index.mdx must place Catalog heading directly above Project Kick-off Checklist'
  );

  // Verify runbooks imports and usage
  assert.match(
    rbContent,
    /import\s*\{[^}]*CardGrid[^}]*\}\s*from\s*['"]@astrojs\/starlight\/components['"]/,
    'runbooks/index.mdx must import CardGrid'
  );
  assert.match(
    rbContent,
    /import\s*\{[^}]*LinkCard[^}]*\}\s*from\s*['"]@astrojs\/starlight\/components['"]/,
    'runbooks/index.mdx must import LinkCard'
  );
  assert.match(
    rbContent,
    /<CardGrid>[\s\S]*?<\/CardGrid>/,
    'runbooks/index.mdx must render <CardGrid>'
  );

  const expectedRunbookLinks = [
    '/runbooks/git/',
    '/runbooks/containers/',
    '/runbooks/ai-coding-assistants/',
    '/runbooks/daily-toolkit/',
    '/runbooks/linux/',
    '/runbooks/sql/',
    '/runbooks/vim/',
  ];
  for (const link of expectedRunbookLinks) {
    const escapedLink = link.replace(/\//g, '\\/');
    assert.match(
      rbContent,
      new RegExp(`<LinkCard[^>]*href=["']${escapedLink}["']`),
      `runbooks/index.mdx must link to ${link}`
    );
  }
});
