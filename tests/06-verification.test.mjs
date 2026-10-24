import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(projectRoot, 'dist');

test('Test 1: Production build artifacts — verify ./dist exists', () => {
  if (!fs.existsSync(distDir) || fs.readdirSync(distDir).length === 0) {
    execSync('npm run build', {
      cwd: projectRoot,
      stdio: 'pipe',
      encoding: 'utf8',
    });
  }
  assert.ok(fs.existsSync(distDir), './dist directory must exist after build');
  const stat = fs.statSync(distDir);
  assert.ok(stat.isDirectory(), './dist must be a directory');
});

test('Test 2: Invariant URL routing — verify all 18 content routes have corresponding index.html directories in ./dist/', () => {
  const expectedRoutes = [
    'index.html',
    'deep-dives/index.html',
    'deep-dives/standards/index.html',
    'deep-dives/python/index.html',
    'deep-dives/python/concurrency/index.html',
    'deep-dives/python/environments/index.html',
    'deep-dives/python/functions/index.html',
    'deep-dives/python/tests/index.html',
    'runbooks/index.html',
    'runbooks/ai-coding-assistants/index.html',
    'runbooks/containers/index.html',
    'runbooks/daily-toolkit/index.html',
    'runbooks/linux/index.html',
    'runbooks/sql/index.html',
    'runbooks/vim/index.html',
    'runbooks/git/index.html',
    'runbooks/git/cheat-sheet/index.html',
    'runbooks/git/workflows/index.html',
  ];

  for (const route of expectedRoutes) {
    const routePath = path.join(distDir, route);
    assert.ok(fs.existsSync(routePath), `dist/${route} must exist`);

    const stat = fs.statSync(routePath);
    assert.ok(stat.isFile(), `dist/${route} must be a file`);
    assert.ok(stat.size > 0, `dist/${route} must have non-zero size (got ${stat.size} bytes)`);

    const content = fs.readFileSync(routePath, 'utf8');
    assert.ok(
      content.includes('<!DOCTYPE html>') || content.includes('<html'),
      `dist/${route} must contain valid HTML content`
    );
  }
});

test('Test 3: Domain binding — verify dist/CNAME exists and contains sagalo.pro', () => {
  const cnamePath = path.join(distDir, 'CNAME');
  assert.ok(fs.existsSync(cnamePath), 'dist/CNAME must exist');

  const content = fs.readFileSync(cnamePath, 'utf8').trim();
  assert.strictEqual(content, 'sagalo.pro', 'dist/CNAME must contain exact domain sagalo.pro');
});

test('Test 4: PDF downloads — verify dist/docs/docker.pdf and dist/docs/python-asyncio.pdf exist and have non-zero size', () => {
  const requiredPdfs = ['docker.pdf', 'python-asyncio.pdf'];

  for (const pdf of requiredPdfs) {
    const pdfPath = path.join(distDir, 'docs', pdf);
    assert.ok(fs.existsSync(pdfPath), `dist/docs/${pdf} must exist`);

    const stat = fs.statSync(pdfPath);
    assert.ok(stat.size > 0, `dist/docs/${pdf} must have non-zero size (got ${stat.size} bytes)`);

    const buffer = fs.readFileSync(pdfPath);
    assert.strictEqual(
      buffer.subarray(0, 4).toString(),
      '%PDF',
      `dist/docs/${pdf} must have valid %PDF magic header bytes`
    );
  }
});

test('Test 5: Static imagery — verify dist/images/ contains banner.png, banner.svg, http_requests_types.gif, and sql.jpeg', () => {
  const requiredImages = [
    'banner.png',
    'banner.svg',
    'http_requests_types.gif',
    'sql.jpeg',
  ];

  for (const img of requiredImages) {
    const imgPath = path.join(distDir, 'images', img);
    assert.ok(fs.existsSync(imgPath), `dist/images/${img} must exist`);

    const stat = fs.statSync(imgPath);
    assert.ok(stat.size > 0, `dist/images/${img} must have non-zero size (got ${stat.size} bytes)`);
  }
});

test('Test 6: Pagefind search index — verify dist/pagefind/ exists and contains indexed assets', () => {
  const pagefindDir = path.join(distDir, 'pagefind');
  assert.ok(fs.existsSync(pagefindDir), 'dist/pagefind/ directory must exist');

  const requiredAssets = [
    'pagefind.js',
    'pagefind-entry.json',
    'pagefind-ui.js',
    'pagefind-ui.css',
  ];

  for (const asset of requiredAssets) {
    const assetPath = path.join(pagefindDir, asset);
    assert.ok(fs.existsSync(assetPath), `dist/pagefind/${asset} must exist`);

    const stat = fs.statSync(assetPath);
    assert.ok(stat.size > 0, `dist/pagefind/${asset} must have non-zero size (got ${stat.size} bytes)`);
  }

  // Validate search entry index contains parsed routes
  const entryJson = JSON.parse(fs.readFileSync(path.join(pagefindDir, 'pagefind-entry.json'), 'utf8'));
  assert.ok(entryJson.version, 'pagefind-entry.json must include version');
  assert.ok(entryJson.languages, 'pagefind-entry.json must include languages index');
});

test('Test 7: Dark theme lock — verify built HTML contains color-scheme: dark', () => {
  const indexHtmlPath = path.join(distDir, 'index.html');
  assert.ok(fs.existsSync(indexHtmlPath), 'dist/index.html must exist');

  const html = fs.readFileSync(indexHtmlPath, 'utf8');
  assert.match(html, /data-theme="dark"/, 'HTML must lock data-theme="dark"');

  // Verify compiled CSS assets enforce color-scheme: dark
  const astroDir = path.join(distDir, '_astro');
  assert.ok(fs.existsSync(astroDir), 'dist/_astro directory must exist');

  const cssFiles = fs.readdirSync(astroDir).filter((f) => f.endsWith('.css'));
  assert.ok(cssFiles.length > 0, 'Compiled CSS files must exist in dist/_astro');

  const cssContents = cssFiles
    .map((f) => fs.readFileSync(path.join(astroDir, f), 'utf8'))
    .join('\n');

  assert.match(
    cssContents,
    /color-scheme:\s*dark/i,
    'Built CSS bundle must specify color-scheme: dark'
  );
  assert.match(
    cssContents,
    /starlight-theme-select[^{]*\{[^}]*display:\s*none\s*!important/s,
    'Theme select dropdown must be permanently hidden'
  );
});

test('Test 8: Linting & hygiene — verify pre-commit lint passes', (t) => {
  try {
    execSync('pre-commit --version', { stdio: 'ignore' });
  } catch {
    if (t && typeof t.skip === 'function') {
      t.skip('pre-commit is not installed in this environment (handled by dedicated CI lint job)');
    }
    return;
  }
  const output = execSync('pre-commit run --all-files', {
    cwd: projectRoot,
    stdio: 'pipe',
    encoding: 'utf8',
  });
  assert.ok(
    output.includes('Passed') || !output.includes('Failed'),
    'pre-commit run --all-files must pass without errors'
  );
});

test('Test 9: Built Knowledge Hub & LLM endpoints validation — verify dist/llms.txt, dist/llms-full.txt, and dist/robots.txt', () => {
  // 1. dist/llms.txt validation
  const llmsTxtPath = path.join(distDir, 'llms.txt');
  assert.ok(fs.existsSync(llmsTxtPath), 'dist/llms.txt must exist');

  const llmsStat = fs.statSync(llmsTxtPath);
  assert.ok(llmsStat.isFile(), 'dist/llms.txt must be a file');
  assert.ok(llmsStat.size > 0, `dist/llms.txt must have non-zero size (got ${llmsStat.size} bytes)`);

  const llmsContent = fs.readFileSync(llmsTxtPath, 'utf8');
  assert.match(
    llmsContent,
    /^# Przemysław Sagało — Knowledge Hub/m,
    'dist/llms.txt must start with # Przemysław Sagało — Knowledge Hub'
  );
  assert.match(
    llmsContent,
    /> Principal systems architect, engineering lead, and full-stack technologist\./,
    'dist/llms.txt must contain summary blockquote'
  );
  assert.match(
    llmsContent,
    /## Architecture & Deep Dives/,
    'dist/llms.txt must contain ## Architecture & Deep Dives'
  );
  assert.match(
    llmsContent,
    /## Operational Runbooks/,
    'dist/llms.txt must contain ## Operational Runbooks'
  );
  assert.match(
    llmsContent,
    /\/llms-full\.txt/,
    'dist/llms.txt must contain link to /llms-full.txt'
  );

  // 2. dist/llms-full.txt validation
  const llmsFullTxtPath = path.join(distDir, 'llms-full.txt');
  assert.ok(fs.existsSync(llmsFullTxtPath), 'dist/llms-full.txt must exist');

  const llmsFullStat = fs.statSync(llmsFullTxtPath);
  assert.ok(llmsFullStat.isFile(), 'dist/llms-full.txt must be a file');
  assert.ok(
    llmsFullStat.size > 5000,
    `dist/llms-full.txt must have non-trivial size (>5000 bytes, got ${llmsFullStat.size} bytes)`
  );

  const llmsFullContent = fs.readFileSync(llmsFullTxtPath, 'utf8');
  assert.match(
    llmsFullContent,
    /^# Przemysław Sagało — Knowledge Hub \(Full Markdown Corpus\)/m,
    'dist/llms-full.txt must contain full corpus header'
  );
  assert.match(
    llmsFullContent,
    /URL:\s*https:\/\/sagalo\.pro\//,
    'dist/llms-full.txt must contain canonical URL: tags'
  );
  assert.match(
    llmsFullContent,
    /Tags:\s*.+/,
    'dist/llms-full.txt must contain Tags: headers'
  );

  // 3. dist/robots.txt validation
  const robotsTxtPath = path.join(distDir, 'robots.txt');
  assert.ok(fs.existsSync(robotsTxtPath), 'dist/robots.txt must exist');

  const robotsStat = fs.statSync(robotsTxtPath);
  assert.ok(robotsStat.isFile(), 'dist/robots.txt must be a file');
  assert.ok(robotsStat.size > 0, `dist/robots.txt must have non-zero size (got ${robotsStat.size} bytes)`);

  const robotsContent = fs.readFileSync(robotsTxtPath, 'utf8');
  assert.match(
    robotsContent,
    /Sitemap:\s*https:\/\/sagalo\.pro\/sitemap-index\.xml/,
    'dist/robots.txt must declare Sitemap: https://sagalo.pro/sitemap-index.xml'
  );
  assert.match(
    robotsContent,
    /User-agent:\s*\*/,
    'dist/robots.txt must declare User-agent: *'
  );

  const requiredBots = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'CCBot'];
  for (const bot of requiredBots) {
    const botPattern = new RegExp(`User-agent:\\s*${bot}[\\s\\S]*?Allow:\\s*\\/`, 'm');
    assert.match(
      robotsContent,
      botPattern,
      `dist/robots.txt must explicitly allow ${bot}`
    );
  }
});
