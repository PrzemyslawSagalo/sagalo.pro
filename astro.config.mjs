import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://sagalo.pro',
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    starlight({
      title: 'Przemysław Sagało',
      description: 'Systems. Architecture. Execution. Engineering deep dives and operational runbooks by Przemysław Sagało.',
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'English',
          lang: 'en',
        },
      },
      social: {
        github: 'https://github.com/przemyslawsagalo',
      },
      customCss: [
        './src/styles/custom.css',
      ],
      sidebar: [
        {
          label: 'Deep Dives',
          autogenerate: { directory: 'deep-dives' },
        },
        {
          label: 'Runbooks',
          autogenerate: { directory: 'runbooks' },
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
