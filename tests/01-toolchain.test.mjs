import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { register } from 'node:module';

// Intercept @astrojs/starlight import to avoid Node 23 ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING
// when importing astro.config.mjs directly in Node, since Starlight publishes raw .ts files
// that Vite normally compiles during Astro build/dev execution.
const loaderCode = `
export async function resolve(specifier, context, nextResolve) {
  if (specifier === '@astrojs/starlight') {
    return {
      url: 'data:text/javascript,' + encodeURIComponent('export default function starlight(c) { return { name: "@astrojs/starlight", config: c }; }'),
      shortCircuit: true,
      format: 'module',
    };
  }
  return nextResolve(specifier, context);
}
`;
register('data:text/javascript,' + encodeURIComponent(loaderCode), import.meta.url);

const projectRoot = process.cwd();

test('package.json contains required scripts and dependencies', () => {
  const pkgPath = path.join(projectRoot, 'package.json');
  assert.ok(fs.existsSync(pkgPath), 'package.json must exist');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  assert.ok(pkg.scripts, 'package.json must have scripts');
  assert.equal(pkg.scripts.dev, 'astro dev');
  assert.equal(pkg.scripts.build, 'astro check && astro build');
  assert.equal(pkg.scripts.preview, 'astro preview');
  assert.equal(pkg.scripts.check, 'astro check');

  assert.ok(pkg.dependencies, 'package.json must have dependencies');
  const requiredDeps = [
    'astro',
    '@astrojs/starlight',
    '@astrojs/mdx',
    '@fontsource/inter',
    '@astrojs/check',
    'sharp',
    'typescript'
  ];
  for (const dep of requiredDeps) {
    assert.ok(pkg.dependencies[dep], `package.json must include ${dep}`);
  }
});

test('astro.config.mjs exports output: static, trailingSlash: always, site URL, and Starlight integration', async () => {
  const configPath = path.join(projectRoot, 'astro.config.mjs');
  assert.ok(fs.existsSync(configPath), 'astro.config.mjs must exist');
  
  const content = fs.readFileSync(configPath, 'utf8');
  assert.match(content, /site:\s*['"]https:\/\/sagalo\.pro['"]/);
  assert.match(content, /output:\s*['"]static['"]/);
  assert.match(content, /trailingSlash:\s*['"]always['"]/);
  assert.match(content, /starlight\(/);

  const configModule = await import(`file://${configPath}`);
  const config = configModule.default;
  assert.equal(config.site, 'https://sagalo.pro');
  assert.equal(config.output, 'static');
  assert.equal(config.trailingSlash, 'always');
  assert.ok(Array.isArray(config.integrations), 'integrations must be an array');
  assert.ok(config.integrations.length > 0, 'integrations must contain Starlight');
});

test('tsconfig.json extends astro/tsconfigs/strict with jsx: preserve', () => {
  const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
  assert.ok(fs.existsSync(tsconfigPath), 'tsconfig.json must exist');
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  assert.equal(tsconfig.extends, 'astro/tsconfigs/strict');
  assert.equal(tsconfig.compilerOptions?.jsx, 'preserve');
});

test('legacy Hugo configuration files are decommissioned', () => {
  const legacyPaths = [
    path.join(projectRoot, 'hugo.yaml'),
    path.join(projectRoot, 'go.mod'),
    path.join(projectRoot, 'go.sum'),
    path.join(projectRoot, 'archetypes'),
  ];
  for (const legacyPath of legacyPaths) {
    assert.ok(!fs.existsSync(legacyPath), `Legacy path must not exist: ${legacyPath}`);
  }
});
