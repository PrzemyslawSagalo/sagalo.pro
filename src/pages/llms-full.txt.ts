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

function parseAttributes(attrs: string): Map<string, string> {
  const map = new Map<string, string>();
  const regex = /([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([^}]*)\})/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(attrs)) !== null) {
    const key = match[1].toLowerCase();
    const val = (match[2] ?? match[3] ?? match[4] ?? '').trim();
    if (!map.has(key)) {
      map.set(key, val);
    }
  }
  return map;
}

export function stripStarlightJsx(content: string): string {
  const codeBlocks: string[] = [];

  // Protect fenced code blocks (```...``` or ~~~...~~~) and inline code spans (`...`)
  // so literal code examples are not altered during MDX tag transformations.
  let protectedContent = content.replace(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g, (match) => {
    const id = `\x00__CODE_BLOCK_${codeBlocks.length}__\x00`;
    codeBlocks.push(match);
    return id;
  });

  protectedContent = protectedContent.replace(/(`+)([\s\S]*?)\1/g, (match) => {
    const id = `\x00__CODE_BLOCK_${codeBlocks.length}__\x00`;
    codeBlocks.push(match);
    return id;
  });

  // 1. Strip MDX import declarations
  let cleaned = protectedContent
    .replace(/^import\s+[^;\n]+;\s*$/gm, '')
    .replace(/^import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];?\s*$/gm, '');

  // 2. Serialize LinkCards into Markdown links with descriptions before stripping wrapper tags.
  // The tag matcher and tokenizer prevent quoted attribute values from masking or interfering with real attributes.
  const linkCardRegex = /<LinkCard\b((?:[^>"'{}]|"[^"]*"|'[^']*'|\{[^}]*\})*)\/?>/gi;
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
  const tabItemRegex = /<TabItem\b((?:[^>"'{}]|"[^"]*"|'[^']*'|\{[^}]*\})*)>/gi;
  cleaned = cleaned.replace(tabItemRegex, (_, attrs) => {
    const attrMap = parseAttributes(attrs);
    const label = attrMap.get('label') || '';
    return label ? `\n\n**Tab: ${label}**\n\n` : '\n';
  });

  // 4. Strip remaining Starlight wrapper tags (<CardGrid>, <Tabs>, <Steps>, etc.)
  const wrapperTagsRegex = /<\/?(?:Tabs|TabItem|Steps|FileTree|CardGrid)\b(?:[^>"'{}]|"[^"]*"|'[^']*'|\{[^}]*\})*\/?>/gi;
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
