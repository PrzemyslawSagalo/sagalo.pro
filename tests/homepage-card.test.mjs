import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const llmCardPath = path.join(projectRoot, 'src/components/LlmContextCard.astro');
const customCssPath = path.join(projectRoot, 'src/styles/custom.css');
const indexMdxPath = path.join(projectRoot, 'src/content/docs/index.mdx');

test('Test 1: LlmContextCard.astro exists and contains heading, badge, and dual action links', () => {
  assert.ok(fs.existsSync(llmCardPath), 'src/components/LlmContextCard.astro must exist');
  const cardContent = fs.readFileSync(llmCardPath, 'utf8');

  // Verify heading "Knowledge Hub Context for LLMs"
  assert.match(
    cardContent,
    /Knowledge Hub Context for LLMs/,
    'LlmContextCard must contain heading "Knowledge Hub Context for LLMs"'
  );

  // Verify badge text "llmstxt.org Standard"
  assert.match(
    cardContent,
    /llmstxt\.org Standard/,
    'LlmContextCard must contain badge text "llmstxt.org Standard"'
  );

  // Verify dual action links
  assert.match(
    cardContent,
    /href="\/llms\.txt"/,
    'LlmContextCard must link to /llms.txt'
  );
  assert.match(
    cardContent,
    /href="\/llms-full\.txt"/,
    'LlmContextCard must link to /llms-full.txt'
  );

  // Verify container class
  assert.match(
    cardContent,
    /class="llm-card-featured"/,
    'LlmContextCard must have root class llm-card-featured'
  );
});

test('Test 2: src/styles/custom.css defines .feature-grid.cols-3 (with desktop repeat(3, 1fr)), .llm-card-featured, .llm-badge, .btn-primary, and .btn-secondary', () => {
  assert.ok(fs.existsSync(customCssPath), 'src/styles/custom.css must exist');
  const css = fs.readFileSync(customCssPath, 'utf8');

  // Verify .feature-grid.cols-3 base definition
  assert.match(
    css,
    /\.feature-grid\.cols-3\s*\{[^}]*grid-template-columns:\s*1fr/,
    'custom.css must define .feature-grid.cols-3 default 1fr'
  );

  // Verify .feature-grid.cols-3 desktop media query with repeat(3, 1fr)
  assert.match(
    css,
    /@media[^{]+\{(?:[^{}]*\{[^}]*\})*?[^{}]*\.feature-grid\.cols-3\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*1fr\)/s,
    'custom.css must define .feature-grid.cols-3 repeat(3, 1fr) under a desktop media query'
  );

  // Verify .llm-card-featured
  assert.match(
    css,
    /\.llm-card-featured\s*\{/,
    'custom.css must define .llm-card-featured'
  );

  // Verify .llm-badge
  assert.match(
    css,
    /\.llm-badge\s*\{/,
    'custom.css must define .llm-badge'
  );

  // Verify .btn-primary and .btn-secondary
  assert.match(
    css,
    /\.btn-primary\s*\{/,
    'custom.css must define .btn-primary'
  );
  assert.match(
    css,
    /\.btn-secondary\s*\{/,
    'custom.css must define .btn-secondary'
  );
});

test('Test 3: src/content/docs/index.mdx imports and mounts LlmContextCard alongside existing FeatureGrid and HeroBanner', () => {
  assert.ok(fs.existsSync(indexMdxPath), 'src/content/docs/index.mdx must exist');
  const indexContent = fs.readFileSync(indexMdxPath, 'utf8');

  // Verify imports
  assert.match(
    indexContent,
    /import\s+LlmContextCard\s+from\s+['"][^'"]*LlmContextCard\.astro['"]/,
    'index.mdx must import LlmContextCard component'
  );
  assert.match(
    indexContent,
    /import\s+HeroBanner\s+from\s+['"][^'"]*HeroBanner\.astro['"]/,
    'index.mdx must import HeroBanner component'
  );
  assert.match(
    indexContent,
    /import\s+FeatureGrid\s+from\s+['"][^'"]*FeatureGrid\.astro['"]/,
    'index.mdx must import FeatureGrid component'
  );

  // Verify mounting order / presence
  assert.match(
    indexContent,
    /<HeroBanner\s*\/>.*<LlmContextCard\s*\/>.*<FeatureGrid/s,
    'index.mdx must mount LlmContextCard alongside HeroBanner and FeatureGrid'
  );
});
