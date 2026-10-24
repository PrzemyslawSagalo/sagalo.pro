import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const customCssPath = path.join(projectRoot, 'src/styles/custom.css');

test('Test 1: src/styles/custom.css imports @fontsource-variable/inter and does not import static @fontsource/inter', () => {
  const content = fs.readFileSync(customCssPath, 'utf8');

  assert.match(
    content,
    /@import\s+['"]@fontsource-variable\/inter['"];?/,
    'src/styles/custom.css must import "@fontsource-variable/inter"'
  );

  assert.equal(
    content.includes('@fontsource/inter/latin-'),
    false,
    'src/styles/custom.css must not import individual static latin weights'
  );
});

test('Test 2: src/styles/custom.css :root selector contains zero !important declarations', () => {
  const content = fs.readFileSync(customCssPath, 'utf8');
  const rootMatch = content.match(/:root\s*\{([\s\S]*?)\}/);

  assert.ok(rootMatch, ':root block must exist in custom.css');
  const rootBody = rootMatch[1];

  assert.equal(
    rootBody.includes('!important'),
    false,
    ':root declarations must not contain "!important"'
  );
});

test('Test 3: src/styles/custom.css html, body and body selectors contain zero !important declarations', () => {
  const content = fs.readFileSync(customCssPath, 'utf8');
  const htmlBodyMatch = content.match(/html\s*,\s*body\s*\{([\s\S]*?)\}/);

  assert.ok(htmlBodyMatch, 'html, body block must exist in custom.css');
  assert.equal(
    htmlBodyMatch[1].includes('!important'),
    false,
    'html, body block must not contain "!important"'
  );

  const bodyMatch = content.match(/(?:^|\n)body\s*\{([\s\S]*?)\}/);
  assert.ok(bodyMatch, 'body block must exist in custom.css');
  assert.equal(
    bodyMatch[1].includes('!important'),
    false,
    'body block must not contain "!important"'
  );
});
