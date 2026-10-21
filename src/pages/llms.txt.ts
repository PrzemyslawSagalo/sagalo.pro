import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const getCanonicalUrl = (id: string): string => {
  const cleanId = id
    .replace(/\/index\.(md|mdx)$/, '')
    .replace(/\.(md|mdx)$/, '')
    .replace(/(^|\/)index$/, '');
  return cleanId ? `https://sagalo.pro/${cleanId}/` : 'https://sagalo.pro/';
};

export interface DocEntryLike {
  id: string;
  data: {
    title: string;
    description?: string;
  };
}

export function generateLlmsTxt(docs: DocEntryLike[]): string {
  const contentDocs = docs.filter(
    (doc) => doc.id.replace(/\.(md|mdx)$/, '') !== 'index'
  );

  const deepDives = contentDocs
    .filter((doc) => doc.id.startsWith('deep-dives'))
    .sort((a, b) => a.id.localeCompare(b.id));

  const runbooks = contentDocs
    .filter((doc) => doc.id.startsWith('runbooks'))
    .sort((a, b) => a.id.localeCompare(b.id));

  const lines: string[] = [
    '# Przemysław Sagało — Knowledge Hub',
    '',
    '> Principal systems architect, engineering lead, and full-stack technologist.',
    '> Curated operational runbooks, systems architecture standards, and engineering deep dives.',
    '',
    '## Architecture & Deep Dives',
  ];

  for (const doc of deepDives) {
    const desc = doc.data.description || doc.data.title;
    lines.push(`- [${doc.data.title}](${getCanonicalUrl(doc.id)}): ${desc}`);
  }

  lines.push('');
  lines.push('## Operational Runbooks');

  for (const doc of runbooks) {
    const desc = doc.data.description || doc.data.title;
    lines.push(`- [${doc.data.title}](${getCanonicalUrl(doc.id)}): ${desc}`);
  }

  lines.push('');
  lines.push('## Full Corpus');
  lines.push(
    '- [Complete Markdown Corpus](https://sagalo.pro/llms-full.txt): Aggregated documentation in a single plain text file for context injection.'
  );
  lines.push('');

  return lines.join('\n');
}

export const GET: APIRoute = async () => {
  const docs = await getCollection('docs');
  const output = generateLlmsTxt(docs);

  return new Response(output, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
