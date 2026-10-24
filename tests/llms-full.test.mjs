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
      url: 'data:text/javascript,' + encodeURIComponent('export function getCollection() { return []; }'),
      shortCircuit: true,
      format: 'module',
    };
  }
  if (specifier === './llms.txt') {
    return {
      url: new URL('./llms.txt.ts', context.parentURL).href,
      shortCircuit: true,
    };
  }
  return nextResolve(specifier, context);
}
`;
register('data:text/javascript,' + encodeURIComponent(loaderCode), { parentURL: import.meta.url });

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const llmsFullTsPath = path.join(projectRoot, 'src/pages/llms-full.txt.ts');

test('Test 1: stripStarlightJsx strips single-line and multiline <CardGrid>, </CardGrid>, <LinkCard ... /> without removing inner text', async () => {
  const { stripStarlightJsx } = await import(`file://${llmsFullTsPath}`);
  assert.equal(typeof stripStarlightJsx, 'function', 'stripStarlightJsx must be exported');

  const input = `
<CardGrid>
  <LinkCard
    title="Git Workflows"
    href="/runbooks/git/workflows/"
    description="Multi-branch sync, detached HEAD recovery, and commit audits."
  />
</CardGrid>
Some regular markdown text here.
`;

  const output = stripStarlightJsx(input);
  assert.equal(output.includes('<CardGrid>'), false, 'Should strip opening <CardGrid>');
  assert.equal(output.includes('</CardGrid>'), false, 'Should strip closing </CardGrid>');
  assert.equal(output.includes('<LinkCard'), false, 'Should strip multiline <LinkCard>');
  assert.ok(
    output.includes('- [Git Workflows](/runbooks/git/workflows/): Multi-branch sync, detached HEAD recovery, and commit audits.'),
    'Must serialize LinkCard into Markdown link with description'
  );
  assert.ok(output.includes('Some regular markdown text here.'), 'Must preserve regular text');

  const inputWithQuotes = `
<CardGrid>
  <LinkCard
    title="Developer's Guide"
    href="/guide/"
    description="Python > JavaScript comparison"
  />
</CardGrid>
`;
  const outputQuotes = stripStarlightJsx(inputWithQuotes);
  assert.ok(
    outputQuotes.includes("- [Developer's Guide](/guide/): Python > JavaScript comparison"),
    'Must handle apostrophes and > in quoted LinkCard attributes without truncation'
  );

  const inputWithNestedAttrValues = `
<CardGrid>
  <LinkCard
    description="Example: title='Fake Title' href='/fake/'"
    title="Real Title"
    href="/real/"
  />
</CardGrid>
`;
  const outputNested = stripStarlightJsx(inputWithNestedAttrValues);
  assert.ok(
    outputNested.includes("- [Real Title](/real/): Example: title='Fake Title' href='/fake/'"),
    'Must not confuse attribute-like text inside a quoted description with real attributes'
  );

  const inputWithJsxExpressions = `
<CardGrid>
  <LinkCard
    title={"JSX Guide"}
    href={"/jsx-guide/"}
    description={"Decoded expression description"}
  />
  <LinkCard
    title={'Single Quote JSX'}
    href={'/single/'}
  />
</CardGrid>
`;
  const outputJsx = stripStarlightJsx(inputWithJsxExpressions);
  assert.ok(
    outputJsx.includes('- [JSX Guide](/jsx-guide/): Decoded expression description'),
    'Must decode static JSX string expressions without leaving literal quotes in markdown links'
  );
  assert.ok(
    outputJsx.includes('- [Single Quote JSX](/single/)'),
    'Must decode single-quoted JSX string expressions'
  );

  const inputWithBracesInJsx = `
<CardGrid>
  <LinkCard
    title={"Using {name}"}
    href="/guide/"
    description={"Desc with {braces}"}
  />
</CardGrid>
`;
  const outputBraces = stripStarlightJsx(inputWithBracesInJsx);
  assert.ok(
    outputBraces.includes('- [Using {name}](/guide/): Desc with {braces}'),
    'Must handle closing braces inside quoted JSX expressions without breaking serialization'
  );

  const inputWithTemplateLiterals = `
<CardGrid>
  <LinkCard
    title={\`Template Guide\`}
    href={\`/template-guide/\`}
    description={\`Template description\`}
  />
</CardGrid>
`;
  const outputTemplate = stripStarlightJsx(inputWithTemplateLiterals);
  assert.ok(
    outputTemplate.includes('- [Template Guide](/template-guide/): Template description'),
    'Must handle JSX template literal attributes without inserting backticks into Markdown link or destination'
  );
  assert.equal(
    outputTemplate.includes('`/template-guide/`'),
    false,
    'Destination must not contain backticks'
  );

  const inputWithEscapedQuotes = `
<CardGrid>
  <LinkCard
    title={'Developer\\'s Guide'}
    href="/guide/"
    description={"A \\"Special\\" Description"}
  />
</CardGrid>
`;
  const outputEscaped = stripStarlightJsx(inputWithEscapedQuotes);
  assert.ok(
    outputEscaped.includes("- [Developer's Guide](/guide/): A \"Special\" Description"),
    'Must parse escaped quotes inside JSX expression string literals'
  );
});

test('Test 2: stripStarlightJsx strips <Tabs>, </Tabs>, <TabItem>, <Steps>, and <FileTree> tags while preserving tab labels', async () => {
  const { stripStarlightJsx } = await import(`file://${llmsFullTsPath}`);

  const input = `
<Tabs>
  <TabItem aria-label="Accessible name" label="npm">
    npm install foo
  </TabItem>
  <TabItem label="pnpm (Fast & Efficient)">
    pnpm add foo
  </TabItem>
</Tabs>

<Steps>
1. Step one
2. Step two
</Steps>

<FileTree>
- astro.config.mjs
</FileTree>
`;

  const output = stripStarlightJsx(input);
  assert.equal(output.includes('<Tabs>'), false);
  assert.equal(output.includes('</Tabs>'), false);
  assert.equal(output.includes('<TabItem'), false);
  assert.equal(output.includes('</TabItem>'), false);
  assert.equal(output.includes('<Steps>'), false);
  assert.equal(output.includes('</Steps>'), false);
  assert.equal(output.includes('<FileTree>'), false);
  assert.equal(output.includes('</FileTree>'), false);
  assert.ok(output.includes('**Tab: npm**'), 'Must preserve simple TabItem label as Markdown heading');
  assert.ok(output.includes('**Tab: pnpm (Fast & Efficient)**'), 'Must preserve TabItem label with parentheses');
  assert.ok(!output.includes('**Tab: Accessible name**'), 'Must not mistake aria-label for label');
  assert.ok(output.includes('npm install foo'), 'Must retain inner tab content');
  assert.ok(output.includes('pnpm add foo'), 'Must retain second tab content');
  assert.ok(output.includes('Step one'), 'Must retain inner steps content');

  const inputWithJsxTab = `
<Tabs>
  <TabItem label={"JSX Tab"}>
    Content inside JSX tab
  </TabItem>
</Tabs>
`;
  const outputJsxTab = stripStarlightJsx(inputWithJsxTab);
  assert.ok(outputJsxTab.includes('**Tab: JSX Tab**'), 'Must decode JSX string expression in TabItem label');

  const inputWithBracesInTab = `
<Tabs>
  <TabItem label={"Tab with {id}"}>
    Tab body
  </TabItem>
</Tabs>
`;
  const outputBracesTab = stripStarlightJsx(inputWithBracesInTab);
  assert.ok(
    outputBracesTab.includes('**Tab: Tab with {id}**'),
    'Must handle closing braces inside TabItem JSX expressions'
  );
});

test('Test 3: stripStarlightJsx strips MDX import declarations', async () => {
  const { stripStarlightJsx } = await import(`file://${llmsFullTsPath}`);

  const input = `
import { CardGrid, LinkCard } from '@astrojs/starlight/components';
import Something from './Something.astro';

# Document Header

Content goes here.
`;

  const output = stripStarlightJsx(input);
  assert.equal(output.includes('import { CardGrid'), false, 'Must strip curly import');
  assert.equal(output.includes('import Something'), false, 'Must strip default import');
  assert.ok(output.includes('# Document Header'), 'Must preserve markdown headings');
  assert.ok(output.includes('Content goes here.'), 'Must preserve markdown body');
});

test('Test 4: src/pages/llms-full.txt.ts imports getCanonicalUrl from "./llms.txt" without .ts extension', () => {
  const fileContent = fs.readFileSync(llmsFullTsPath, 'utf8');

  assert.match(
    fileContent,
    /import\s*\{\s*getCanonicalUrl\s*\}\s*from\s*['"]\.\/llms\.txt['"];?/,
    'src/pages/llms-full.txt.ts must import getCanonicalUrl from "./llms.txt"'
  );
  assert.equal(
    fileContent.includes("from './llms.txt.ts'"),
    false,
    'Must not import from "./llms.txt.ts"'
  );
});

test('Test 5: stripStarlightJsx preserves literal JSX examples in fenced code blocks and inline code spans', async () => {
  const { stripStarlightJsx } = await import(`file://${llmsFullTsPath}`);

  const input = `
Here is a live card:
<CardGrid>
  <LinkCard title="Live Card" href="/live/" description="Live description" />
</CardGrid>

Here is a fenced code block showing usage:
\`\`\`mdx
import { CardGrid, LinkCard } from '@astrojs/starlight/components';

<CardGrid>
  <LinkCard title="Fenced Example" href="/fenced/" description="Fenced desc" />
</CardGrid>
\`\`\`

Here is an inline code snippet: \`<LinkCard title="Inline Example" href="/inline/" />\`.
`;

  const output = stripStarlightJsx(input);

  // Live card outside code blocks must be serialized
  assert.ok(
    output.includes('- [Live Card](/live/): Live description'),
    'Live card outside code blocks must be serialized'
  );

  // Fenced code block must remain completely unchanged
  assert.ok(
    output.includes('<CardGrid>\n  <LinkCard title="Fenced Example" href="/fenced/" description="Fenced desc" />\n</CardGrid>'),
    'Fenced code block must retain literal <CardGrid> and <LinkCard> tags'
  );
  assert.ok(
    output.includes("import { CardGrid, LinkCard } from '@astrojs/starlight/components';"),
    'Fenced code block must retain literal MDX import declaration'
  );

  // Inline code must remain unchanged
  assert.ok(
    output.includes('`<LinkCard title="Inline Example" href="/inline/" />`'),
    'Inline code span must retain literal <LinkCard> tag'
  );

  const inputNestedFences = `
Here is a 4-backtick code fence containing a nested 3-backtick fence:
\`\`\`\`markdown
Here is a nested 3-backtick MDX example:
\`\`\`mdx
<CardGrid>
  <LinkCard title="Nested Example" href="/nested/" description="Nested desc" />
</CardGrid>
\`\`\`
Closing the outer 4-backtick block:
\`\`\`\`
`;

  const outputNestedFences = stripStarlightJsx(inputNestedFences);
  assert.ok(
    outputNestedFences.includes('<LinkCard title="Nested Example" href="/nested/" description="Nested desc" />'),
    'Nested 3-backtick fence within 4-backtick fence must not be altered'
  );
  assert.equal(
    outputNestedFences.includes('- [Nested Example]'),
    false,
    'Nested card must not be converted into a markdown list item'
  );

  const inputCodeSpanWithBackticks = 'Here is a code span with backticks: `foo``` <CardGrid>keep</CardGrid>` and trailing text.';
  const outputCodeSpanWithBackticks = stripStarlightJsx(inputCodeSpanWithBackticks);
  assert.ok(
    outputCodeSpanWithBackticks.includes('`foo``` <CardGrid>keep</CardGrid>`'),
    'Code span containing shorter or longer backtick runs must preserve literal tags'
  );

  const inputMixedBackticks = 'Single backtick containing double: `echo ``hello`` and <CardGrid>keep</CardGrid>` done.';
  const outputMixedBackticks = stripStarlightJsx(inputMixedBackticks);
  assert.ok(
    outputMixedBackticks.includes('`echo ``hello`` and <CardGrid>keep</CardGrid>`'),
    'Single-backtick code span containing paired double-backtick runs must restore completely without leaking placeholders'
  );
  assert.equal(
    outputMixedBackticks.includes('__CODE_BLOCK_'),
    false,
    'No code block placeholders must leak into final output'
  );

  const inputLiveCardBetweenMixedSpans = `First \`span with \`\`double\`\` backticks\`\n\n<LinkCard title="Live Card" href="/live/" />\n\nSecond \`span with \`\`double\`\` backticks\``;
  const outputLiveCardBetweenMixedSpans = stripStarlightJsx(inputLiveCardBetweenMixedSpans);
  assert.ok(
    outputLiveCardBetweenMixedSpans.includes('- [Live Card](/live/)'),
    'Live card between two code spans containing double backticks must be serialized rather than swallowed'
  );
  assert.ok(
    outputLiveCardBetweenMixedSpans.includes('First `span with ``double`` backticks`'),
    'First code span must be preserved'
  );
  assert.ok(
    outputLiveCardBetweenMixedSpans.includes('Second `span with ``double`` backticks`'),
    'Second code span must be preserved'
  );

  // Regression: Escaped backticks should not open code spans or swallow subsequent live cards
  const inputEscapedBackticks = 'Text with \\` escaped backtick and live card:\n\n<LinkCard title="Live Escaped" href="/live-escaped/" />\n\nAnd code span after: `<LinkCard title="Protected Code" href="/protected/" />`';
  const outputEscapedBackticks = stripStarlightJsx(inputEscapedBackticks);
  assert.ok(
    outputEscapedBackticks.includes('- [Live Escaped](/live-escaped/)'),
    'Live LinkCard after escaped backtick must be converted to markdown link'
  );
  assert.ok(
    outputEscapedBackticks.includes('`<LinkCard title="Protected Code" href="/protected/" />`'),
    'Literal LinkCard in code span after escaped backtick must remain unchanged'
  );

  // Regression: Indented code blocks (4 spaces/tabs) must preserve literal JSX examples
  const inputIndentedCode = `Here is some text:\n\n    <LinkCard title="Indented Card" href="/indented/" />\n\nFollowed by live card:\n<LinkCard title="Live After Indented" href="/after-indented/" />`;
  const outputIndentedCode = stripStarlightJsx(inputIndentedCode);
  assert.ok(
    outputIndentedCode.includes('    <LinkCard title="Indented Card" href="/indented/" />'),
    'Indented code block must retain literal <LinkCard> tag'
  );
  assert.equal(
    outputIndentedCode.includes('- [Indented Card]'),
    false,
    'Indented code block must not be converted into a markdown list item'
  );
  assert.ok(
    outputIndentedCode.includes('- [Live After Indented](/after-indented/)'),
    'Live card after indented code block must be serialized'
  );

  // Regression: Blockquoted code fences (> ~~~mdx) must preserve literal JSX examples
  const inputBlockquotedFence = `> ~~~mdx\n> <LinkCard title="BqFence Card" href="/bq/" />\n> ~~~\n\n<LinkCard title="Outside Bq" href="/outside/" />`;
  const outputBlockquotedFence = stripStarlightJsx(inputBlockquotedFence);
  assert.ok(
    outputBlockquotedFence.includes('> <LinkCard title="BqFence Card" href="/bq/" />'),
    'Blockquoted code fence must retain literal <LinkCard> tag'
  );
  assert.equal(
    outputBlockquotedFence.includes('- [BqFence Card]'),
    false,
    'Blockquoted code fence card must not be converted to markdown link'
  );
  assert.ok(
    outputBlockquotedFence.includes('- [Outside Bq](/outside/)'),
    'Live card outside blockquoted fence must be serialized'
  );

  // Regression: Single-line backtick span with backticks in info string must not be treated as fence opener
  const inputBacktickInfoSpan = `\`\`\`foo\`\`\` inline span\n\n<LinkCard title="After Inline Span" href="/after-span/" />`;
  const outputBacktickInfoSpan = stripStarlightJsx(inputBacktickInfoSpan);
  assert.ok(
    outputBacktickInfoSpan.includes('- [After Inline Span](/after-span/)'),
    'Live card following single-line triple-backtick span must be serialized and not swallowed by false fence'
  );
});
