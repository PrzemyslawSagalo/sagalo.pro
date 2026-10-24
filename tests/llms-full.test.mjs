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

  // Regression: MDX container tabs with 4-space indented code fences and blank lines
  const inputWithIndentedFencesAndBlankLines = `
<Tabs>
  <TabItem label="Docker">
    \`\`\`bash
    # Inspect system disk usage across images, containers, and build cache
    docker system df

    # Live resource utilization
    docker stats
    \`\`\`
  </TabItem>
  <TabItem label="Podman">
    \`\`\`bash
    # Inspect system disk usage across images, containers, and build cache
    podman system df

    # Live resource utilization
    podman stats
    \`\`\`
  </TabItem>
</Tabs>
`;
  const outputIndentedFences = stripStarlightJsx(inputWithIndentedFencesAndBlankLines);
  assert.ok(outputIndentedFences.includes('**Tab: Docker**'), 'Must preserve Docker TabItem label');
  assert.ok(outputIndentedFences.includes('**Tab: Podman**'), 'Must preserve Podman TabItem label');
  assert.equal(outputIndentedFences.includes('<TabItem'), false, 'Must strip all <TabItem> tags');
  assert.equal(outputIndentedFences.includes('</TabItem>'), false, 'Must strip all </TabItem> tags');
  assert.equal(outputIndentedFences.includes('<Tabs>'), false, 'Must strip <Tabs> tag');
  assert.equal(outputIndentedFences.includes('</Tabs>'), false, 'Must strip </Tabs> tag');
  assert.ok(outputIndentedFences.includes('docker stats'), 'Must preserve code inside first tab');
  assert.ok(outputIndentedFences.includes('podman stats'), 'Must preserve code inside second tab');
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

  // Regression: Code spans must not match across Markdown paragraphs (blank lines)
  const inputParaBoundary = 'Paragraph one with ` unmatched backtick.\n\n<LinkCard title="Intervening Card" href="/intervening/" />\n\nParagraph two with ` unmatched backtick.';
  const outputParaBoundary = stripStarlightJsx(inputParaBoundary);
  assert.ok(
    outputParaBoundary.includes('- [Intervening Card](/intervening/)'),
    'Live LinkCard between paragraphs with unmatched backticks must be serialized'
  );

  // Regression: Unclosed fenced code block inside blockquote must end when blockquote ends
  const inputUnclosedBqFence = '> ~~~mdx\n> <LinkCard title="Bq Example Card" href="/bq-example/" />\n\n<LinkCard title="Live Outside Blockquote" href="/outside-bq/" />';
  const outputUnclosedBqFence = stripStarlightJsx(inputUnclosedBqFence);
  assert.ok(
    outputUnclosedBqFence.includes('<LinkCard title="Bq Example Card" href="/bq-example/" />'),
    'Literal LinkCard in blockquoted fence must remain unchanged'
  );
  assert.ok(
    outputUnclosedBqFence.includes('- [Live Outside Blockquote](/outside-bq/)'),
    'Live card outside blockquote must be serialized even if blockquote fence had no closing delimiter'
  );

  // Regression: Unclosed blockquoted fence immediately followed by unquoted LinkCard without blank line
  const inputUnclosedBqAdjacent = '> ~~~mdx\n> <LinkCard title="Bq Example Card" href="/bq-example/" />\n<LinkCard title="Outside" href="/outside/" />';
  const outputUnclosedBqAdjacent = stripStarlightJsx(inputUnclosedBqAdjacent);
  assert.ok(
    outputUnclosedBqAdjacent.includes('<LinkCard title="Bq Example Card" href="/bq-example/" />'),
    'Literal LinkCard in blockquoted fence must remain unchanged'
  );
  assert.ok(
    outputUnclosedBqAdjacent.includes('- [Outside](/outside/)'),
    'Adjacent unquoted live card immediately after unclosed blockquote fence must be serialized'
  );

  // Regression: Fenced code blocks inside list items (- ~~~mdx or 1. ```mdx)
  const inputListFence = '- ~~~mdx\n  <LinkCard title="List Item Example" href="/list-example/" />\n  ~~~\n\n<LinkCard title="Live After List" href="/after-list/" />';
  const outputListFence = stripStarlightJsx(inputListFence);
  assert.ok(
    outputListFence.includes('<LinkCard title="List Item Example" href="/list-example/" />'),
    'Literal LinkCard in list item fence must remain unchanged'
  );
  assert.equal(
    outputListFence.includes('- [List Item Example]'),
    false,
    'List item fence card must not be converted into a markdown link'
  );
  assert.ok(
    outputListFence.includes('- [Live After List](/after-list/)'),
    'Live card after list item fence must be serialized'
  );

  // Regression: Unclosed list-item fence with blank line followed by unindented live card
  const inputUnclosedListWithBlank = '- ~~~mdx\n  <LinkCard title="List Item Example" href="/list-example/" />\n\n<LinkCard title="Live After List" href="/after-list/" />';
  const outputUnclosedListWithBlank = stripStarlightJsx(inputUnclosedListWithBlank);
  assert.ok(
    outputUnclosedListWithBlank.includes('<LinkCard title="List Item Example" href="/list-example/" />'),
    'Literal LinkCard in unclosed list fence must remain unchanged'
  );
  assert.equal(
    outputUnclosedListWithBlank.includes('- [List Item Example]'),
    false,
    'List item fence card must not be converted into a markdown link'
  );
  assert.ok(
    outputUnclosedListWithBlank.includes('- [Live After List](/after-list/)'),
    'Live card after unclosed list fence with blank line must be serialized'
  );

  // Regression: Unclosed list-item fence immediately followed by unindented live card without blank line
  const inputUnclosedListAdjacent = '- ~~~mdx\n  <LinkCard title="List Item Example" href="/list-example/" />\n<LinkCard title="Live Adjacent List" href="/adjacent-list/" />';
  const outputUnclosedListAdjacent = stripStarlightJsx(inputUnclosedListAdjacent);
  assert.ok(
    outputUnclosedListAdjacent.includes('<LinkCard title="List Item Example" href="/list-example/" />'),
    'Literal LinkCard in unclosed list fence must remain unchanged'
  );
  assert.ok(
    outputUnclosedListAdjacent.includes('- [Live Adjacent List](/adjacent-list/)'),
    'Live card immediately adjacent to unclosed list fence must be serialized'
  );

  // Regression: Blockquoted list fences (> - ~~~mdx) combining blockquotes with list containers
  const inputBqListFence = '> - ~~~mdx\n>   <LinkCard title="Bq List Example" href="/bq-list/" />\n>   ~~~\n\n<LinkCard title="Live After Bq List" href="/after-bq-list/" />';
  const outputBqListFence = stripStarlightJsx(inputBqListFence);
  assert.ok(
    outputBqListFence.includes('<LinkCard title="Bq List Example" href="/bq-list/" />'),
    'Literal LinkCard in blockquoted list fence must remain unchanged'
  );
  assert.equal(
    outputBqListFence.includes('- [Bq List Example]'),
    false,
    'Blockquoted list fence card must not be converted into a markdown link'
  );
  assert.ok(
    outputBqListFence.includes('- [Live After Bq List](/after-bq-list/)'),
    'Live card after blockquoted list fence must be serialized'
  );

  // Regression: Unclosed blockquoted list fence followed by live card outside blockquote
  const inputUnclosedBqListFence = '> - ~~~mdx\n>   <LinkCard title="Unclosed Bq List Example" href="/unclosed-bq-list/" />\n\n<LinkCard title="Live Outside Bq List" href="/outside-bq-list/" />';
  const outputUnclosedBqList = stripStarlightJsx(inputUnclosedBqListFence);
  assert.ok(
    outputUnclosedBqList.includes('<LinkCard title="Unclosed Bq List Example" href="/unclosed-bq-list/" />'),
    'Literal LinkCard in unclosed blockquoted list fence must remain unchanged'
  );
  assert.ok(
    outputUnclosedBqList.includes('- [Live Outside Bq List](/outside-bq-list/)'),
    'Live card outside blockquote must be serialized when blockquoted list fence is unclosed'
  );

  // Regression: Root-level fence containing literal blockquoted fence (> ~~~) must not close prematurely
  const inputRootFenceWithBqContent = '~~~mdx\nLiteral blockquote fence:\n> ~~~\n<LinkCard title="Example Card" href="/example/" />\n~~~\n\n<LinkCard title="Live After Root Fence" href="/after-root/" />';
  const outputRootWithBq = stripStarlightJsx(inputRootFenceWithBqContent);
  assert.ok(
    outputRootWithBq.includes('<LinkCard title="Example Card" href="/example/" />'),
    'Literal LinkCard following > ~~~ inside root-level fence must remain unchanged'
  );
  assert.equal(
    outputRootWithBq.includes('- [Example Card]'),
    false,
    'Card inside root-level fence must not be converted into a markdown link'
  );
  assert.ok(
    outputRootWithBq.includes('- [Live After Root Fence](/after-root/)'),
    'Live card after root-level fence must be serialized'
  );

  // Regression: Root-level fence containing literal 4-space indented fence (    ~~~) must not close prematurely
  const inputRootFenceWithIndentedContent = '~~~mdx\nLiteral indented fence:\n    ~~~\n<LinkCard title="Indented Example Card" href="/indented-example/" />\n~~~\n\n<LinkCard title="Live After Indented Fence" href="/after-indented-fence/" />';
  const outputRootWithIndented = stripStarlightJsx(inputRootFenceWithIndentedContent);
  assert.ok(
    outputRootWithIndented.includes('<LinkCard title="Indented Example Card" href="/indented-example/" />'),
    'Literal LinkCard following 4-space indented fence inside root-level fence must remain unchanged'
  );
  assert.equal(
    outputRootWithIndented.includes('- [Indented Example Card]'),
    false,
    'Card inside root-level fence must not be converted into a markdown link'
  );
  assert.ok(
    outputRootWithIndented.includes('- [Live After Indented Fence](/after-indented-fence/)'),
    'Live card after root-level fence containing indented fence must be serialized'
  );

  // Regression: Root-level fence opened with 1 to 3 spaces must reject 4-space indented closing fences
  for (const spaces of [1, 2, 3]) {
    const indent = ' '.repeat(spaces);
    const inputSpacedOpener = `${indent}~~~mdx\nLiteral indented fence:\n    ~~~\n<LinkCard title="Example ${spaces} Space" href="/example-${spaces}/" />\n${indent}~~~\n\n<LinkCard title="Live After ${spaces} Space" href="/after-${spaces}/" />`;
    const outputSpacedOpener = stripStarlightJsx(inputSpacedOpener);
    assert.ok(
      outputSpacedOpener.includes(`<LinkCard title="Example ${spaces} Space" href="/example-${spaces}/" />`),
      `Literal LinkCard inside fence opened with ${spaces} space(s) must remain unchanged`
    );
    assert.equal(
      outputSpacedOpener.includes(`- [Example ${spaces} Space]`),
      false,
      `Card inside ${spaces}-space opener fence must not be converted into a markdown link`
    );
    assert.ok(
      outputSpacedOpener.includes(`- [Live After ${spaces} Space](/after-${spaces}/)`),
      `Live card after ${spaces}-space opener fence must be serialized`
    );
  }

  // Regression: List fence closed by dedented delimiter that starts a root-level fence
  const inputListToRootFence = '- ~~~mdx\n  <LinkCard title="List Item Example" href="/list-ex/" />\n~~~\n<LinkCard title="Root Example" href="/root-ex/" />\n~~~\n\n<LinkCard title="Live After Transition" href="/after-trans/" />';
  const outputListToRoot = stripStarlightJsx(inputListToRootFence);
  assert.ok(
    outputListToRoot.includes('<LinkCard title="List Item Example" href="/list-ex/" />'),
    'List item example card must remain literal code'
  );
  assert.equal(
    outputListToRoot.includes('- [List Item Example]'),
    false,
    'List item example card must not be converted to link'
  );
  assert.ok(
    outputListToRoot.includes('<LinkCard title="Root Example" href="/root-ex/" />'),
    'Root code example card must remain literal code'
  );
  assert.equal(
    outputListToRoot.includes('- [Root Example]'),
    false,
    'Root code example card must not be converted to link'
  );
  assert.ok(
    outputListToRoot.includes('- [Live After Transition](/after-trans/)'),
    'Live card following root fence must be serialized'
  );

  // Regression: Root-level 4-space indented fence opener rejected as indented code block
  const inputRoot4SpaceOpener = '    ~~~mdx\n    <LinkCard title="Indented Code Card" href="/indented-code/" />\n\n<LinkCard title="Live After Indented Code" href="/live-after-code/" />';
  const outputRoot4Space = stripStarlightJsx(inputRoot4SpaceOpener);
  assert.ok(
    outputRoot4Space.includes('<LinkCard title="Indented Code Card" href="/indented-code/" />'),
    'Indented code card must remain literal code'
  );
  assert.equal(
    outputRoot4Space.includes('- [Indented Code Card]'),
    false,
    'Indented code card must not be converted to link'
  );
  assert.ok(
    outputRoot4Space.includes('- [Live After Indented Code](/live-after-code/)'),
    'Live card after 4-space indented code must be serialized'
  );

  // Regression: Prose containing inline code span `<Tabs>` must not increment MDX container depth
  // Indented example following prose must be treated as indented code, and live card must be serialized.
  const inputProseWithCodeSpan = `Use \`<Tabs>\` to group tabbed content.

    ~~~mdx
    <LinkCard title="Indented Example" href="/indented-ex/" />
    ~~~

<LinkCard title="Live Card After Prose" href="/live-after-prose/" />`;
  const outputProseWithCodeSpan = stripStarlightJsx(inputProseWithCodeSpan);
  assert.ok(
    outputProseWithCodeSpan.includes('<LinkCard title="Indented Example" href="/indented-ex/" />'),
    'Indented example card must remain literal code'
  );
  assert.equal(
    outputProseWithCodeSpan.includes('- [Indented Example]'),
    false,
    'Indented example card must not be converted to link'
  );
  assert.ok(
    outputProseWithCodeSpan.includes('- [Live Card After Prose](/live-after-prose/)'),
    'Live card following prose with code span must be serialized'
  );

  // Regression: Indented code block within Markdown blockquote must remain literal code
  const inputBlockquoteIndentedCode = `> Blockquote text
>
>     <LinkCard title="Literal Blockquoted Card" href="/literal-bq/" />
>     Another code line
>
> Back to blockquote text`;
  const outputBlockquoteIndented = stripStarlightJsx(inputBlockquoteIndentedCode);
  assert.ok(
    outputBlockquoteIndented.includes('<LinkCard title="Literal Blockquoted Card" href="/literal-bq/" />'),
    'Indented code block within blockquote must remain literal code'
  );
  assert.equal(
    outputBlockquoteIndented.includes('Literal Blockquoted Card](/literal-bq/)'),
    false,
    'Indented code in blockquote must not be converted to markdown link'
  );

  // Regression: Four-space-indented live components inside CardGrid after blank line must be serialized
  const inputIndentedInCardGrid = `<CardGrid>

    <LinkCard title="Live Card In CardGrid" href="/live-in-grid/" />

</CardGrid>`;
  const outputIndentedInCardGrid = stripStarlightJsx(inputIndentedInCardGrid);
  assert.ok(
    outputIndentedInCardGrid.includes('- [Live Card In CardGrid](/live-in-grid/)'),
    'Four-space indented live card in CardGrid must be serialized to markdown link'
  );
  assert.equal(
    outputIndentedInCardGrid.includes('<LinkCard'),
    false,
    'CardGrid child must not remain raw JSX'
  );

  // Regression: Four-space-indented live components inside TabItem after blank line must be serialized
  const inputIndentedInTabItem = `<Tabs>
  <TabItem label="Featured">

    <LinkCard title="Live Card In TabItem" href="/live-in-tab/" />

  </TabItem>
</Tabs>`;
  const outputIndentedInTabItem = stripStarlightJsx(inputIndentedInTabItem);
  assert.ok(
    outputIndentedInTabItem.includes('- [Live Card In TabItem](/live-in-tab/)'),
    'Four-space indented live card in TabItem must be serialized to markdown link'
  );
  assert.equal(
    outputIndentedInTabItem.includes('<LinkCard'),
    false,
    'TabItem child must not remain raw JSX'
  );

  // Regression: Template normalization must be limited to JSX attribute values and not alter prose code spans
  const inputProseTemplateSpan = 'The option syntax is value={`<CardGrid>literal</CardGrid>`}.';
  const outputProseTemplate = stripStarlightJsx(inputProseTemplateSpan);
  assert.ok(
    outputProseTemplate.includes('value={`<CardGrid>literal</CardGrid>`}'),
    'Prose inline code span containing JSX template syntax must retain backticks and literal component tags'
  );
  assert.equal(
    outputProseTemplate.includes('value={"literal"}'),
    false,
    'Prose code span must not be normalized to JSX attribute format'
  );

  // Regression: Fenced code block on a list-continuation line below a numbered-list paragraph
  const inputListContinuationFence = `1. First list item paragraph.

    ~~~mdx
    <LinkCard title="Continuation Example" href="/cont-ex/" />
    ~~~

<LinkCard title="Live Card After Numbered List" href="/live-after-numbered/" />`;
  const outputListContinuation = stripStarlightJsx(inputListContinuationFence);
  assert.ok(
    outputListContinuation.includes('<LinkCard title="Continuation Example" href="/cont-ex/" />'),
    'Continuation line fence must retain literal LinkCard code'
  );
  assert.equal(
    outputListContinuation.includes('- [Continuation Example]'),
    false,
    'Continuation line fence content must not be converted to link'
  );
  assert.ok(
    outputListContinuation.includes('- [Live Card After Numbered List](/live-after-numbered/)'),
    'Live card following list continuation fence must be serialized'
  );

  // Regression: Dedented root fence delimiter below list continuation must not be consumed as list closer
  const inputListContinuationWithDedentedRoot = `* Bullet item paragraph.

    ~~~mdx
    <LinkCard title="Bullet List Example" href="/bullet-ex/" />
~~~
<LinkCard title="Root Fence Example" href="/root-fence-ex/" />
~~~

<LinkCard title="Live After Transitions" href="/after-transitions/" />`;
  const outputListDedentedRoot = stripStarlightJsx(inputListContinuationWithDedentedRoot);
  assert.ok(
    outputListDedentedRoot.includes('<LinkCard title="Bullet List Example" href="/bullet-ex/" />'),
    'Bullet list continuation fence must preserve literal code'
  );
  assert.ok(
    outputListDedentedRoot.includes('<LinkCard title="Root Fence Example" href="/root-fence-ex/" />'),
    'Root fence must preserve literal code'
  );
  assert.ok(
    outputListDedentedRoot.includes('- [Live After Transitions](/after-transitions/)'),
    'Live card after fence transitions must be serialized'
  );

  // Regression: Indented code block inside list items (relative to list content indentation + 4 spaces)
  const inputListIndentedCode = `- Example:

      <LinkCard title="Literal List Item Code" href="/literal-list/" />
      Another code line

  Continuation paragraph in list item.`;
  const outputListIndentedCode = stripStarlightJsx(inputListIndentedCode);
  assert.ok(
    outputListIndentedCode.includes('<LinkCard title="Literal List Item Code" href="/literal-list/" />'),
    'Indented code block inside list item must retain literal LinkCard code'
  );
  assert.equal(
    outputListIndentedCode.includes('- [Literal List Item Code]'),
    false,
    'Indented code inside list item must not be converted to link'
  );
  assert.ok(
    outputListIndentedCode.includes('Continuation paragraph in list item.'),
    'List continuation paragraph must be preserved'
  );

  // Regression: Multiline container opener (<CardGrid\n  stagger\n>) must increment container depth across lines
  const inputMultilineCardGrid = `<CardGrid
  stagger
>

    <LinkCard title="Live In Multiline CardGrid" href="/live-multiline-grid/" />

</CardGrid>`;
  const outputMultilineCardGrid = stripStarlightJsx(inputMultilineCardGrid);
  assert.ok(
    outputMultilineCardGrid.includes('- [Live In Multiline CardGrid](/live-multiline-grid/)'),
    'Four-space indented live card in multiline CardGrid wrapper must be serialized to markdown link'
  );
  assert.equal(
    outputMultilineCardGrid.includes('<LinkCard'),
    false,
    'Card inside multiline CardGrid wrapper must not remain raw JSX'
  );

  // Regression: Fence with component tags in metadata (e.g. ~~~mdx title="<Tabs>") must open as fence
  const inputFenceWithComponentInMeta = `~~~mdx title="<Tabs>"
<LinkCard title="Example Card in Fence" href="/meta-ex/" />
~~~

<LinkCard title="Live Card After Fence" href="/live-after-meta/" />`;
  const outputFenceMeta = stripStarlightJsx(inputFenceWithComponentInMeta);
  assert.ok(
    outputFenceMeta.includes('<LinkCard title="Example Card in Fence" href="/meta-ex/" />'),
    'LinkCard inside fence with component tag in title metadata must remain literal code'
  );
  assert.equal(
    outputFenceMeta.includes('- [Example Card in Fence]'),
    false,
    'Example card inside fence must not be converted to link'
  );
  assert.ok(
    outputFenceMeta.includes('- [Live Card After Fence](/live-after-meta/)'),
    'Live card following fence must be serialized to markdown link'
  );
  assert.equal(
    outputFenceMeta.includes('<LinkCard title="Live Card After Fence"'),
    false,
    'Live card after fence must not remain raw JSX'
  );

  // Regression: Indented code starting with > must remain literal code (not a blockquote)
  const inputIndentedCodeWithGt = `Some introductory text.

    > <LinkCard title="Literal Blockquote Code" href="/literal-gt/" />

Continuation paragraph.`;
  const outputIndentedGt = stripStarlightJsx(inputIndentedCodeWithGt);
  assert.ok(
    outputIndentedGt.includes('> <LinkCard title="Literal Blockquote Code" href="/literal-gt/" />'),
    'Indented code starting with > must retain literal LinkCard code'
  );
  assert.equal(
    outputIndentedGt.includes('- [Literal Blockquote Code]'),
    false,
    'Indented code starting with > must not be converted to link'
  );

  // Regression: Indented code starting with a bullet marker must remain literal code (not a list item)
  const inputIndentedCodeWithBullet = `Some introductory text.

    - <LinkCard title="Literal Bullet Code" href="/literal-bullet/" />

Continuation paragraph.`;
  const outputIndentedBullet = stripStarlightJsx(inputIndentedCodeWithBullet);
  assert.ok(
    outputIndentedBullet.includes('- <LinkCard title="Literal Bullet Code" href="/literal-bullet/" />'),
    'Indented code starting with bullet must retain literal LinkCard code'
  );
  assert.equal(
    outputIndentedBullet.includes('- - [Literal Bullet Code]'),
    false,
    'Indented code starting with bullet must not be converted to list link'
  );

  // Regression: Four-space indented fence marker in blockquote is an indented code block, not a fence
  const inputBlockquoteIndentedFence = `>     ~~~mdx
>     <LinkCard title="Literal Code In BQ" href="/literal-bq/" />
>
> <LinkCard title="Live Card In BQ" href="/live-bq/" />`;
  const outputBqIndentedFence = stripStarlightJsx(inputBlockquoteIndentedFence);
  assert.ok(
    outputBqIndentedFence.includes('~~~mdx'),
    'Indented fence opener in blockquote must be preserved as literal text'
  );
  assert.ok(
    outputBqIndentedFence.includes('<LinkCard title="Literal Code In BQ" href="/literal-bq/" />'),
    'Indented code in blockquote must retain literal LinkCard'
  );
  assert.ok(
    outputBqIndentedFence.includes('> - [Live Card In BQ](/live-bq/)'),
    'Live card following blank quote line must be serialized to markdown link'
  );
  assert.equal(
    outputBqIndentedFence.includes('<LinkCard title="Live Card In BQ"'),
    false,
    'Live card in blockquote must not remain raw JSX'
  );

  // Regression: Six-space indented fence marker inside bullet item is an indented code block, not a fence
  const inputBulletIndentedFence = `- Bullet item

      ~~~mdx
      <LinkCard title="Literal Code In Bullet" href="/literal-bullet-code/" />

  <LinkCard title="Live Card In Bullet" href="/live-bullet-card/" />`;
  const outputBulletIndentedFence = stripStarlightJsx(inputBulletIndentedFence);
  assert.ok(
    outputBulletIndentedFence.includes('~~~mdx'),
    'Six-space indented fence marker in bullet must be preserved as literal text'
  );
  assert.ok(
    outputBulletIndentedFence.includes('<LinkCard title="Literal Code In Bullet" href="/literal-bullet-code/" />'),
    'Indented code in bullet item must retain literal LinkCard'
  );
  assert.ok(
    outputBulletIndentedFence.includes('- [Live Card In Bullet](/live-bullet-card/)'),
    'Live card in bullet following blank line must be serialized to markdown link'
  );
  assert.equal(
    outputBulletIndentedFence.includes('<LinkCard title="Live Card In Bullet"'),
    false,
    'Live card in bullet must not remain raw JSX'
  );
});
