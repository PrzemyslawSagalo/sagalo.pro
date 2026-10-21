import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        description: z.string().optional(),
        tags: z.array(z.string()).default([]),
        difficulty: z.enum(['introductory', 'intermediate', 'advanced']).optional(),
        prerequisites: z.array(z.string()).default([]),
        lastReviewed: z.coerce.date().optional(),
        llmContext: z.string().optional(),
      }),
    }),
  }),
};
