import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getCanonicalUrl } from './llms.txt.ts';

export interface FullDocEntryLike {
  id: string;
  body?: string;
  data: {
    title: string;
    tags?: string[];
  };
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
    // Strip MDX import declarations so plaintext corpus remains clean for LLM context injection
    const bodyStr = rawBody
      .replace(/^import\s+[^;\n]+;\s*$/gm, '')
      .replace(/^import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];?\s*$/gm, '')
      .trim();
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
