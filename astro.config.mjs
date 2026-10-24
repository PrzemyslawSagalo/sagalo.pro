import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://sagalo.pro',
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    sitemap(),
    starlight({
      title: 'Przemysław Sagało',
      description: 'Systems. Architecture. Execution. Engineering deep dives and operational runbooks by Przemysław Sagało.',
      favicon: '/favicon.svg',
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'English',
          lang: 'en',
        },
      },
      lastUpdated: true,
      editLink: {
        baseUrl: 'https://github.com/przemyslawsagalo/sagalo.pro/edit/main/',
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/przemyslawsagalo',
        },
      ],
      customCss: [
        './src/styles/custom.css',
      ],
      sidebar: [
        {
          label: 'Deep Dives',
          items: [{ autogenerate: { directory: 'deep-dives' } }],
        },
        {
          label: 'Runbooks',
          items: [{ autogenerate: { directory: 'runbooks' } }],
        },
      ],
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 3,
      },
      components: {},
    }),
  ],
});
