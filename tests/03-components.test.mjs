import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const customCssPath = path.join(projectRoot, 'src/styles/custom.css');
const heroBannerPath = path.join(projectRoot, 'src/components/HeroBanner.astro');
const featureGridPath = path.join(projectRoot, 'src/components/FeatureGrid.astro');
const featureCardPath = path.join(projectRoot, 'src/components/FeatureCard.astro');

test('Test 1: src/styles/custom.css exists and imports Inter fontsource stylesheet', () => {
  assert.ok(fs.existsSync(customCssPath), 'src/styles/custom.css must exist');
  const css = fs.readFileSync(customCssPath, 'utf8');

  assert.match(
    css,
    /@import\s+['"]@fontsource(-variable)?\/inter/m,
    'custom.css must import Inter fontsource stylesheet'
  );
});

test('Test 2: custom.css overrides --sl-color-bg and locks color-scheme: dark on :root and html/body', () => {
  assert.ok(fs.existsSync(customCssPath), 'src/styles/custom.css must exist');
  const css = fs.readFileSync(customCssPath, 'utf8');

  // Verify institutional dark token and Starlight variable overrides
  assert.match(css, /--theme-bg-dark:\s*#0b0f19/, 'custom.css must define --theme-bg-dark: #0b0f19');
  assert.match(css, /--sl-color-bg:\s*var\(--theme-bg-dark\)/, 'custom.css must override --sl-color-bg');

  // Verify color-scheme: dark on :root
  assert.match(
    css,
    /:root\s*\{[^}]*color-scheme:\s*dark/s,
    ':root must enforce color-scheme: dark'
  );

  // Verify color-scheme: dark and background-color on html, body
  assert.match(
    css,
    /html,\s*body\s*\{[^}]*color-scheme:\s*dark/s,
    'html, body must enforce color-scheme: dark'
  );
  assert.match(
    css,
    /body\s*\{[^}]*radial-gradient/s,
    'body must configure radial background glow'
  );
});

test('Test 3: custom.css hides starlight-theme-select with display: none !important', () => {
  assert.ok(fs.existsSync(customCssPath), 'src/styles/custom.css must exist');
  const css = fs.readFileSync(customCssPath, 'utf8');

  assert.match(
    css,
    /starlight-theme-select[^{]*\{[^}]*display:\s*none\s*!important/s,
    'starlight-theme-select must be hidden with display: none !important'
  );
});

test('Test 4: HeroBanner.astro contains role-badge, hero-headline, and links to /deep-dives/ and /runbooks/', () => {
  assert.ok(fs.existsSync(heroBannerPath), 'src/components/HeroBanner.astro must exist');
  const hero = fs.readFileSync(heroBannerPath, 'utf8');

  assert.match(hero, /class="hero-banner-panel"/, 'HeroBanner must have hero-banner-panel container');
  assert.match(hero, /class="role-badge"/, 'HeroBanner must contain role-badge');
  assert.match(hero, /class="role-badge-dot"/, 'HeroBanner must contain role-badge-dot');
  assert.match(hero, /class="hero-headline"/, 'HeroBanner must contain hero-headline');
  assert.match(hero, /class="hero-subtext"/, 'HeroBanner must contain hero-subtext');
  assert.match(hero, /href="\/deep-dives\/"/, 'HeroBanner must link to /deep-dives/');
  assert.match(hero, /href="\/runbooks\/"/, 'HeroBanner must link to /runbooks/');
});

test('Test 5: FeatureCard.astro supports icon branching (code, terminal) and frosted card container classes', () => {
  assert.ok(fs.existsSync(featureCardPath), 'src/components/FeatureCard.astro must exist');
  assert.ok(fs.existsSync(featureGridPath), 'src/components/FeatureGrid.astro must exist');

  const card = fs.readFileSync(featureCardPath, 'utf8');
  const grid = fs.readFileSync(featureGridPath, 'utf8');

  // FeatureCard checks
  assert.match(card, /class="feature-card"/, 'FeatureCard must have feature-card class');
  assert.match(card, /class="feature-card-header"/, 'FeatureCard must have feature-card-header class');
  assert.match(card, /icon\s*===\s*['"]code['"]/, 'FeatureCard must branch on icon === "code"');
  assert.match(card, /icon\s*===\s*['"]terminal['"]/, 'FeatureCard must branch on icon === "terminal"');
  assert.match(card, /<h3 class="feature-title">\{title\}<\/h3>/, 'FeatureCard must render title');
  assert.match(card, /<p class="feature-subtitle">\{subtitle\}<\/p>/, 'FeatureCard must render subtitle');

  // FeatureGrid checks
  assert.match(grid, /feature-grid/, 'FeatureGrid must use feature-grid class');
  assert.match(grid, /<slot\s*\/>/, 'FeatureGrid must render a default slot');
});
