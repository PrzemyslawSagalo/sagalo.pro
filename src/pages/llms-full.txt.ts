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

function getAttribute(attrs: string, name: string): string {
  const match = attrs.match(new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)'|\\{([^}]*)\\})`, 'i'));
  if (!match) return '';
  return (match[1] ?? match[2] ?? match[3] ?? '').trim();
}

export function stripStarlightJsx(content: string): string {
  // 1. Strip MDX import declarations
  let cleaned = content
    .replace(/^import\s+[^;\n]+;\s*$/gm, '')
    .replace(/^import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];?\s*$/gm, '');

  // 2. Serialize LinkCards into Markdown links with descriptions before stripping wrapper tags.
  // The tag matcher is quote-aware and delimiter-safe for attributes containing quotes, apostrophes, and >.
  const linkCardRegex = /<LinkCard\b((?:[^>"'{}]|"[^"]*"|'[^']*'|\{[^}]*\})*)\/?>/gi;
  cleaned = cleaned.replace(linkCardRegex, (_, attrs) => {
    const title = getAttribute(attrs, 'title');
    const href = getAttribute(attrs, 'href');
    const desc = getAttribute(attrs, 'description');

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
    const label = getAttribute(attrs, 'label');
    return label ? `\n\n**Tab: ${label}**\n\n` : '\n';
  });

  // 4. Strip remaining Starlight wrapper tags (<CardGrid>, <Tabs>, <Steps>, etc.)
  const wrapperTagsRegex = /<\/?(?:Tabs|TabItem|Steps|FileTree|CardGrid)\b(?:[^>"'{}]|"[^"]*"|'[^']*'|\{[^}]*\})*\/?>/gi;
  return cleaned
    .replace(wrapperTagsRegex, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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
