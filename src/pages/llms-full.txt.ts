import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getCanonicalUrl } from './llms.txt';

export interface FullDocEntryLike {
  id: string;
  body?: string;
  data: {
    title: string;
    tags?: string[];
  };
}

const JSX_STRING_LITERAL = '(?:(?:"(?:[^"\\\\]|\\\\.)*")|(?:\'(?:[^\'\\\\]|\\\\.)*\')|(?:`(?:[^`\\\\]|\\\\.)*`))';
const JSX_EXPR_INNER = `(?:[^}"\'\`]|${JSX_STRING_LITERAL})*`;
const JSX_ATTR_VALUE_PATTERN = `(?:"((?:[^"\\\\]|\\\\.)*)"|'((?:[^\'\\\\]|\\\\.)*)'|\\{(${JSX_EXPR_INNER})\\})`;
const TAG_ATTR_PATTERN = `(?:[^>"\'\`{}]|${JSX_STRING_LITERAL}|\\{${JSX_EXPR_INNER}\\})*`;

function decodeJsxValue(rawVal: string): string {
  const trimmed = rawVal.trim();
  const quoteMatch = trimmed.match(/^(['"`])([\s\S]*)\1$/);
  if (!quoteMatch) {
    return trimmed;
  }
  const quote = quoteMatch[1];
  let unquoted = quoteMatch[2];
  if (quote === '"' || quote === "'") {
    unquoted = unquoted.replace(new RegExp(`\\\\${quote}`, 'g'), quote);
  }
  return unquoted;
}

function parseAttributes(attrs: string): Map<string, string> {
  const map = new Map<string, string>();
  const regex = new RegExp(`([a-zA-Z0-9_-]+)\\s*=\\s*${JSX_ATTR_VALUE_PATTERN}`, 'g');
  let match: RegExpExecArray | null;
  while ((match = regex.exec(attrs)) !== null) {
    const key = match[1].toLowerCase();
    let val: string;
    if (match[2] !== undefined) {
      val = match[2].replace(/\\"/g, '"');
    } else if (match[3] !== undefined) {
      val = match[3].replace(/\\'/g, "'");
    } else if (match[4] !== undefined) {
      val = decodeJsxValue(match[4]);
    } else {
      val = '';
    }
    if (!map.has(key)) {
      map.set(key, val);
    }
  }
  return map;
}

function protectInlineCodeSpans(str: string, codeBlocks: string[], minRunLen = 1, maxRunLen = Infinity): string {
  let result = '';
  let i = 0;
  while (i < str.length) {
    if (str[i] === '`') {
      const runStart = i;
      while (i < str.length && str[i] === '`') i++;
      const runLen = i - runStart;

      if (runLen < minRunLen || runLen > maxRunLen) {
        result += str.slice(runStart, i);
        continue;
      }

      let closeStart = -1;
      let j = i;
      while (j < str.length) {
        if (str[j] === '`') {
          const cStart = j;
          while (j < str.length && str[j] === '`') j++;
          const cLen = j - cStart;
          if (cLen === runLen) {
            closeStart = cStart;
            break;
          }
        } else {
          j++;
        }
      }

      if (closeStart !== -1) {
        const spanText = str.slice(runStart, closeStart + runLen);
        const id = `\x00__CODE_BLOCK_${codeBlocks.length}__\x00`;
        codeBlocks.push(spanText);
        result += id;
        i = closeStart + runLen;
      } else {
        result += str.slice(runStart, i);
      }
    } else {
      result += str[i];
      i++;
    }
  }
  return result;
}

function protectCode(content: string, codeBlocks: string[]): string {
  const lines = content.split('\n');
  const resultLines: string[] = [];
  let inFence = false;
  let fenceChar = '';
  let fenceLength = 0;
  let currentBlock: string[] = [];

  for (const line of lines) {
    if (!inFence) {
      const match = line.match(/^(\s*)(`{3,}|~{3,})(.*)$/);
      if (match) {
        inFence = true;
        fenceChar = match[2][0];
        fenceLength = match[2].length;
        currentBlock = [line];
      } else {
        resultLines.push(line);
      }
    } else {
      currentBlock.push(line);
      const closeMatch = line.match(new RegExp(`^\\s*\\${fenceChar}{${fenceLength},}\\s*$`));
      if (closeMatch) {
        inFence = false;
        const blockText = currentBlock.join('\n');
        const id = `\x00__CODE_BLOCK_${codeBlocks.length}__\x00`;
        codeBlocks.push(blockText);
        resultLines.push(id);
        currentBlock = [];
      }
    }
  }

  if (inFence) {
    const blockText = currentBlock.join('\n');
    const id = `\x00__CODE_BLOCK_${codeBlocks.length}__\x00`;
    codeBlocks.push(blockText);
    resultLines.push(id);
  }

  let fencedContent = resultLines.join('\n');

  // Step 2: Protect multi-backtick Markdown code spans (length >= 2)
  fencedContent = protectInlineCodeSpans(fencedContent, codeBlocks, 2);

  // Step 3: Distinguish and normalize JSX template literal attribute expressions
  fencedContent = fencedContent.replace(/\b([a-zA-Z0-9_-]+\s*=\s*\{\s*)`((?:[^`\\]|\\.)*)`(\s*\})/g, (_, pre, val, post) => {
    const escaped = val.replace(/(?<!\\)"/g, '\\"');
    return `${pre}"${escaped}"${post}`;
  });

  // Step 4: Protect 1-backtick Markdown code spans
  const protectedContent = protectInlineCodeSpans(fencedContent, codeBlocks, 1, 1);

  return protectedContent;
}

export function stripStarlightJsx(content: string): string {
  const codeBlocks: string[] = [];

  // Protect fenced code blocks (tracking opening delimiter length for nested fences)
  // and inline code spans so literal code examples are preserved unchanged.
  const protectedContent = protectCode(content, codeBlocks);

  // 1. Strip MDX import declarations
  let cleaned = protectedContent
    .replace(/^import\s+[^;\n]+;\s*$/gm, '')
    .replace(/^import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];?\s*$/gm, '');

  // 2. Serialize LinkCards into Markdown links with descriptions before stripping wrapper tags.
  // The tag matcher and tokenizer prevent quoted attribute values and nested JSX braces from masking or interfering with real attributes.
  const linkCardRegex = new RegExp(`<LinkCard\\b(${TAG_ATTR_PATTERN})\\/?>`, 'gi');
  cleaned = cleaned.replace(linkCardRegex, (_, attrs) => {
    const attrMap = parseAttributes(attrs);
    const title = attrMap.get('title') || '';
    const href = attrMap.get('href') || '';
    const desc = attrMap.get('description') || '';

    if (title && href) {
      return desc ? `- [${title}](${href}): ${desc}` : `- [${title}](${href})`;
    } else if (title) {
      return desc ? `- **${title}**: ${desc}` : `- **${title}**`;
    }
    return '';
  });

  // 3. Serialize TabItem labels so tab context is preserved in LLM Markdown
  const tabItemRegex = new RegExp(`<TabItem\\b(${TAG_ATTR_PATTERN})>`, 'gi');
  cleaned = cleaned.replace(tabItemRegex, (_, attrs) => {
    const attrMap = parseAttributes(attrs);
    const label = attrMap.get('label') || '';
    return label ? `\n\n**Tab: ${label}**\n\n` : '\n';
  });

  // 4. Strip remaining Starlight wrapper tags (<CardGrid>, <Tabs>, <Steps>, etc.)
  const wrapperTagsRegex = new RegExp(`</?(?:Tabs|TabItem|Steps|FileTree|CardGrid)\\b(${TAG_ATTR_PATTERN})\\/?>`, 'gi');
  cleaned = cleaned
    .replace(wrapperTagsRegex, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Restore protected fenced and inline code blocks
  for (let i = 0; i < codeBlocks.length; i++) {
    cleaned = cleaned.replace(`\x00__CODE_BLOCK_${i}__\x00`, () => codeBlocks[i]);
  }

  return cleaned;
}

export function generateLlmsFullTxt(docs: FullDocEntryLike[]): string {
  const contentDocs = docs
    .filter((doc) => doc.id.replace(/\.(md|mdx)$/, '') !== 'index')
    .sort((a, b) => a.id.localeCompare(b.id));

  const sections: string[] = [
    '# Przemysław Sagało — Knowledge Hub (Full Markdown Corpus)\n> Canonical URL: https://sagalo.pro/llms-full.txt\n> Generated at build time from https://sagalo.pro',
  ];

  for (const doc of contentDocs) {
    const tagsStr = (doc.data.tags || []).join(', ');
    const rawBody = doc.body ? doc.body.trim() : '';
    // Strip MDX imports and Starlight JSX components for clean LLM context injection
    const bodyStr = stripStarlightJsx(rawBody);
    const section = [
      '---',
      '',
      `# ${doc.data.title}`,
      `URL: ${getCanonicalUrl(doc.id)}`,
      `Tags: ${tagsStr}`,
      '',
      bodyStr,
    ].join('\n');

    sections.push(section);
  }

  return sections.join('\n\n') + '\n';
}

export const GET: APIRoute = async () => {
  const docs = await getCollection('docs');
  const output = generateLlmsFullTxt(docs);

  return new Response(output, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
