import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('public/CNAME exists and contains exact string sagalo.pro', () => {
  const cnamePath = path.join(projectRoot, 'public', 'CNAME');
  assert.ok(fs.existsSync(cnamePath), 'public/CNAME must exist');
  const content = fs.readFileSync(cnamePath, 'utf8').trim();
  assert.equal(content, 'sagalo.pro', 'public/CNAME must contain exact string sagalo.pro');

  // Verify legacy static/ directory is removed
  const staticPath = path.join(projectRoot, 'static');
  assert.ok(!fs.existsSync(staticPath), 'static/ directory must not linger in repository');
});

test('public/docs/docker.pdf and public/docs/python-asyncio.pdf exist and have non-zero size', () => {
  const pdfs = ['docker.pdf', 'python-asyncio.pdf'];
  for (const pdf of pdfs) {
    const pdfPath = path.join(projectRoot, 'public', 'docs', pdf);
    assert.ok(fs.existsSync(pdfPath), `public/docs/${pdf} must exist`);
    const stat = fs.statSync(pdfPath);
    assert.ok(stat.size > 0, `public/docs/${pdf} must have non-zero size (got ${stat.size} bytes)`);
  }
});

test('public/images/ contains banner.png, banner.svg, http_requests_types.gif, and sql.jpeg', () => {
  const images = ['banner.png', 'banner.svg', 'http_requests_types.gif', 'sql.jpeg'];
  for (const img of images) {
    const imgPath = path.join(projectRoot, 'public', 'images', img);
    assert.ok(fs.existsSync(imgPath), `public/images/${img} must exist`);
    const stat = fs.statSync(imgPath);
    assert.ok(stat.size > 0, `public/images/${img} must have non-zero size (got ${stat.size} bytes)`);
  }
});

test('.gitignore excludes dist/, .astro/, and node_modules/ while NOT ignoring public/', () => {
  const gitignorePath = path.join(projectRoot, '.gitignore');
  assert.ok(fs.existsSync(gitignorePath), '.gitignore must exist');
  const content = fs.readFileSync(gitignorePath, 'utf8');
  const lines = content.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));

  // Must exclude dist/, .astro/, node_modules/
  const hasDist = lines.some((l) => l === 'dist/' || l === 'dist' || l === './dist/' || l === '/dist');
  assert.ok(hasDist, '.gitignore must exclude dist/ (or ./dist/)');

  const hasAstro = lines.some((l) => l === '.astro/' || l === '.astro' || l === './.astro/' || l === '/.astro');
  assert.ok(hasAstro, '.gitignore must exclude .astro/');

  const hasNodeModules = lines.some((l) => l === 'node_modules/' || l === 'node_modules' || l === '/node_modules');
  assert.ok(hasNodeModules, '.gitignore must exclude node_modules/');

  // Must NOT ignore public/
  const ignoresPublic = lines.some((l) => l === 'public/' || l === 'public' || l === './public/' || l === '/public');
  assert.ok(!ignoresPublic, '.gitignore must not ignore public/');
});
