import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { register } from 'node:module';

const loaderCode = `
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'astro:content') {
    return {
      url: 'data:text/javascript,' + encodeURIComponent('export function defineCollection(c) { return c; } export async function getCollection() { return []; }'),
      shortCircuit: true,
      format: 'module',
    };
  }
  return nextResolve(specifier, context);
}
`;
register('data:text/javascript,' + encodeURIComponent(loaderCode), { parentURL: import.meta.url });

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const llmsTxtPath = path.join(projectRoot, 'src/pages/llms.txt.ts');
const llmsFullTxtPath = path.join(projectRoot, 'src/pages/llms-full.txt.ts');
const robotsTxtPath = path.join(projectRoot, 'public/robots.txt');

test('Test 1: getCanonicalUrl(id) normalization helper converts IDs to HTTPS trailing-slash canonical URLs', async () => {
  assert.ok(fs.existsSync(llmsTxtPath), 'src/pages/llms.txt.ts must exist');
  const { getCanonicalUrl } = await import(`file://${llmsTxtPath}`);
  assert.equal(typeof getCanonicalUrl, 'function', 'getCanonicalUrl must be exported as a function');

  // Test deep-dives with .md extension
  assert.equal(
    getCanonicalUrl('deep-dives/standards.md'),
    'https://sagalo.pro/deep-dives/standards/',
    'deep-dives/standards.md should normalize to canonical URL'
  );

  // Test nested index with .md extension
  assert.equal(
    getCanonicalUrl('runbooks/git/index.md'),
    'https://sagalo.pro/runbooks/git/',
    'runbooks/git/index.md should strip /index and normalize to directory canonical URL'
  );

  // Test root index with .mdx extension
  assert.equal(
    getCanonicalUrl('index.mdx'),
    'https://sagalo.pro/',
    'index.mdx should normalize to root canonical URL'
  );

  // Test without extensions
  assert.equal(
    getCanonicalUrl('deep-dives/standards'),
    'https://sagalo.pro/deep-dives/standards/',
    'deep-dives/standards without extension should normalize correctly'
  );

  assert.equal(
    getCanonicalUrl('runbooks/git/index'),
    'https://sagalo.pro/runbooks/git/',
    'runbooks/git/index without extension should strip /index'
  );

  assert.equal(
    getCanonicalUrl('index'),
    'https://sagalo.pro/',
    'index without extension should normalize to root'
  );

  // Test nested subdirectory file
  assert.equal(
    getCanonicalUrl('deep-dives/python/concurrency.md'),
    'https://sagalo.pro/deep-dives/python/concurrency/',
    'nested python concurrency doc should normalize correctly'
  );
});

test('Test 2: /llms.txt generation logic emits valid llmstxt.org header, summary blockquote, curated sections, and pointer to /llms-full.txt', async () => {
  assert.ok(fs.existsSync(llmsTxtPath), 'src/pages/llms.txt.ts must exist');
  const { generateLlmsTxt, GET } = await import(`file://${llmsTxtPath}`);
  assert.equal(typeof generateLlmsTxt, 'function', 'generateLlmsTxt must be exported as a function');
  assert.equal(typeof GET, 'function', 'GET APIRoute handler must be exported');

  const mockDocs = [
    {
      id: 'index.mdx',
      data: { title: 'Home', description: 'Homepage splash' },
    },
    {
      id: 'deep-dives/standards.md',
      data: {
        title: 'Engineering Standards',
        description: 'Systems architecture standards and conventions.',
      },
    },
    {
      id: 'deep-dives/python/concurrency.md',
      data: {
        title: 'Python Concurrency',
        description: 'Asyncio, threading, and multiprocessing.',
      },
    },
    {
      id: 'runbooks/containers.md',
      data: {
        title: 'Container Operations',
        description: 'Docker and Podman operational workflows.',
      },
    },
    {
      id: 'runbooks/git/workflows.md',
      data: {
        title: 'Git Workflows',
        // Omitted description to verify fallback to title
      },
    },
  ];

  const output = generateLlmsTxt(mockDocs);

  // Header check
  assert.match(output, /^# Przemysław Sagało — Knowledge Hub/m, 'Must start with llmstxt.org title');

  // Summary blockquote
  assert.match(
    output,
    /> Principal systems architect, engineering lead, and full-stack technologist\./,
    'Must include author summary blockquote line 1'
  );
  assert.match(
    output,
    /> Curated operational runbooks, systems architecture standards, and engineering deep dives\./,
    'Must include author summary blockquote line 2'
  );

  // Curated Architecture & Deep Dives section
  assert.match(output, /## Architecture & Deep Dives/, 'Must include Architecture & Deep Dives section');
  assert.match(
    output,
    /- \[Engineering Standards\]\(https:\/\/sagalo\.pro\/deep-dives\/standards\/\): Systems architecture standards and conventions\./,
    'Must list Engineering Standards with canonical URL and description'
  );
  assert.match(
    output,
    /- \[Python Concurrency\]\(https:\/\/sagalo\.pro\/deep-dives\/python\/concurrency\/\): Asyncio, threading, and multiprocessing\./,
    'Must list Python Concurrency with canonical URL and description'
  );

  // Curated Operational Runbooks section
  assert.match(output, /## Operational Runbooks/, 'Must include Operational Runbooks section');
  assert.match(
    output,
    /- \[Container Operations\]\(https:\/\/sagalo\.pro\/runbooks\/containers\/\): Docker and Podman operational workflows\./,
    'Must list Container Operations with canonical URL and description'
  );
  assert.match(
    output,
    /- \[Git Workflows\]\(https:\/\/sagalo\.pro\/runbooks\/git\/workflows\/\): Git Workflows/,
    'Must fallback to title when description is missing'
  );

  // Exclude index splash
  assert.doesNotMatch(output, /- \[Home\]/, 'Must exclude root index splash page');

  // Pointer to /llms-full.txt
  assert.match(output, /## Full Corpus/, 'Must include Full Corpus section');
  assert.match(
    output,
    /- \[Complete Markdown Corpus\]\(https:\/\/sagalo\.pro\/llms-full\.txt\): Aggregated documentation in a single plain text file for context injection\./,
    'Must point to /llms-full.txt'
  );

  // If built dist/llms.txt exists, verify its contents
  const distLlmsPath = path.join(projectRoot, 'dist/llms.txt');
  if (fs.existsSync(distLlmsPath)) {
    const distLlms = fs.readFileSync(distLlmsPath, 'utf8');
    assert.match(distLlms, /^# Przemysław Sagało — Knowledge Hub/m, 'dist/llms.txt must have title');
    assert.match(distLlms, /## Architecture & Deep Dives/, 'dist/llms.txt must have Architecture section');
    assert.match(distLlms, /## Operational Runbooks/, 'dist/llms.txt must have Runbooks section');
    assert.match(distLlms, /## Full Corpus/, 'dist/llms.txt must have Full Corpus section');
  }
});

test('Test 3: /llms-full.txt aggregation logic combines content docs with --- dividers, doc titles, canonical URLs, and tags', async () => {
  assert.ok(fs.existsSync(llmsFullTxtPath), 'src/pages/llms-full.txt.ts must exist');
  const { generateLlmsFullTxt, GET } = await import(`file://${llmsFullTxtPath}`);
  assert.equal(typeof generateLlmsFullTxt, 'function', 'generateLlmsFullTxt must be exported as a function');
  assert.equal(typeof GET, 'function', 'GET APIRoute handler must be exported');

  const mockDocs = [
    {
      id: 'index.mdx',
      body: 'Splash homepage content',
      data: { title: 'Home', tags: ['splash'] },
    },
    {
      id: 'deep-dives/standards.md',
      body: 'Content for architecture standards and 12-factor principles.',
      data: {
        title: 'Engineering Standards',
        tags: ['architecture', 'standards'],
      },
    },
    {
      id: 'runbooks/containers.md',
      body: 'Step-by-step container operations and CLI commands.',
      data: {
        title: 'Container Operations',
        tags: ['containers', 'docker', 'podman'],
      },
    },
  ];

  const output = generateLlmsFullTxt(mockDocs);

  // Header check
  assert.match(
    output,
    /^# Przemysław Sagało — Knowledge Hub \(Full Markdown Corpus\)/m,
    'Must start with full corpus title'
  );
  assert.match(output, /> Canonical URL: https:\/\/sagalo\.pro\/llms-full\.txt/, 'Must include canonical URL');
  assert.match(
    output,
    /> Generated at build time from https:\/\/sagalo\.pro/,
    'Must include build time generation note'
  );

  // Dividers and document structures
  assert.match(output, /---\n\n# Engineering Standards\nURL: https:\/\/sagalo\.pro\/deep-dives\/standards\/\nTags: architecture, standards\n\nContent for architecture standards and 12-factor principles\./);
  assert.match(output, /---\n\n# Container Operations\nURL: https:\/\/sagalo\.pro\/runbooks\/containers\/\nTags: containers, docker, podman\n\nStep-by-step container operations and CLI commands\./);

  // Exclude root index splash
  assert.doesNotMatch(output, /# Home/, 'Must exclude root index splash page');
  assert.doesNotMatch(output, /Splash homepage content/, 'Must exclude splash body');

  // If built dist/llms-full.txt exists, verify its contents
  const distLlmsFullPath = path.join(projectRoot, 'dist/llms-full.txt');
  if (fs.existsSync(distLlmsFullPath)) {
    const distLlmsFull = fs.readFileSync(distLlmsFullPath, 'utf8');
    assert.match(distLlmsFull, /^# Przemysław Sagało — Knowledge Hub \(Full Markdown Corpus\)/m, 'dist/llms-full.txt must have title');
    assert.match(distLlmsFull, /---\n\n#/m, 'dist/llms-full.txt must have dividers');
  }
});

test('Test 4: public/robots.txt contains User-agent: *, Sitemap, explicit Allow: / for AI crawlers, and comments for LLM endpoints', () => {
  assert.ok(fs.existsSync(robotsTxtPath), 'public/robots.txt must exist');

  const content = fs.readFileSync(robotsTxtPath, 'utf8');

  // Universal directives
  assert.match(content, /User-agent:\s*\*/, 'Must include User-agent: *');
  assert.match(content, /Allow:\s*\//, 'Must include Allow: /');
  assert.match(content, /Sitemap:\s*https:\/\/sagalo\.pro\/sitemap-index\.xml/, 'Must specify sitemap-index.xml');

  // AI bot directives
  const requiredBots = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'CCBot'];
  for (const bot of requiredBots) {
    const botPattern = new RegExp(`User-agent:\\s*${bot}[\\s\\S]*?Allow:\\s*\\/`, 'm');
    assert.match(content, botPattern, `Must explicitly allow ${bot}`);
  }

  // Canonical LLM endpoint comments
  assert.match(content, /https:\/\/sagalo\.pro\/llms\.txt/, 'Must document https://sagalo.pro/llms.txt');
  assert.match(content, /https:\/\/sagalo\.pro\/llms-full\.txt/, 'Must document https://sagalo.pro/llms-full.txt');
});
