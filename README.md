# sagalo.pro

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Deploy Astro site to Pages](https://github.com/PrzemyslawSagalo/sagalo.pro/actions/workflows/deploy.yml/badge.svg)](https://github.com/PrzemyslawSagalo/sagalo.pro/actions/workflows/deploy.yml)

Personal Engineering Knowledge Hub, systems architecture deep dives, and operational runbooks built with [Astro](https://astro.build/) and [Starlight](https://starlight.astro.build/), published at [sagalo.pro](https://sagalo.pro/).

## Banner

A clean visual background banner (1584x396) without baked-in text, featuring high-contrast dark tones, ambient glows, and geometric concentric rings. On `sagalo.pro`, text is layered via HTML/CSS; the clean image below is ready for direct use on social profiles or custom overlays:

- **Download**: [Clean PNG](public/images/banner.png) | [Clean Vector SVG](public/images/banner.svg)

![Background Banner](public/images/banner.png)

## Knowledge Hub & LLM Readiness

The entire repository is engineered for dual consumption: human engineers browsing the interactive web documentation, and AI coding assistants consuming structured machine-readable knowledge endpoints with zero HTML scraping overhead.

### Machine-Readable Endpoints

- **[`/llms.txt`](https://sagalo.pro/llms.txt)**: Structured index adhering to the [llmstxt.org](https://llmstxt.org/) standard, providing curated Markdown links, descriptions, prerequisites, and taxonomy tags for all architecture deep dives and operational runbooks.
- **[`/llms-full.txt`](https://sagalo.pro/llms-full.txt)**: Complete aggregated plaintext Markdown knowledge corpus, concatenated with standardized dividers and canonical URL metadata for direct ingestion by large context-window models.

### AI Assistant Consumption

AI coding agents (such as Claude Code, Cursor, GitHub Copilot, and Perplexity) can ingest site knowledge directly:

- **Single Document Context**: Reference `https://sagalo.pro/llms.txt` to discover specific topic paths and fetch targeted clean Markdown without web crawler bloat.
- **Full Repository Context**: Feed `https://sagalo.pro/llms-full.txt` directly into context windows for comprehensive system architecture and runbook reasoning.
- **Crawler Permissions**: `public/robots.txt` explicitly allows polite AI bot discovery (`GPTBot`, `ClaudeBot`, `PerplexityBot`, `CCBot`) and advertises the XML sitemap alongside LLM text endpoints.

## Architecture & Framework

- **Astro 5 SSG**: Static Site Generation with `output: 'static'` and strict directory URLs via `trailingSlash: 'always'`.
- **Starlight Documentation**: Native `@astrojs/starlight` integration featuring automated sidebar generation, client-side Pagefind search, content collection schema validation, and git-backed edit links.
- **Interactive UI Components**: Rich documentation primitives including `<Tabs>`, `<TabItem>`, `<Steps>`, `<FileTree>`, `<CardGrid>`, `<LinkCard>`, and native Starlight Asides (`:::tip`, `:::caution`, `:::danger`).
- **Institutional Dark Theme**: Deep institutional midnight theme locked to `#0b0f19` via `src/styles/custom.css` (`data-theme="dark"` and `color-scheme: dark !important`), with Inter typography (`@fontsource/inter`).

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (`>= 20 LTS`) & npm
- [Python](https://www.python.org/) (`>= 3.10`) & `pre-commit` (for code quality & Markdown hygiene hooks)

### Quick Start with npm

```bash
npm install                  # Install Astro, Starlight, and build toolchain
npm run dev                  # Launch local Starlight dev server at localhost:4321
npm run build                # Type check & compile static SSG bundle into dist/
npm test                     # Run full Node test suite across all test modules
npx astro check              # Run Astro TypeScript & content layer type check
pre-commit run --all-files   # Run code hygiene & markdownlint hooks
```

### Workflow with Make

The repository includes a convenience `Makefile` wrapping common workflows:

```bash
make help     # Display available workflow targets
make serve    # Launch local development server (npm run dev)
make lint     # Run pre-commit checks on all files
make verify   # Run Astro type check (npx astro check)
make build    # Build site with Astro (npm run build)
make preview  # Preview production build locally (npm run preview)
make test     # Run all quality checks (lint + verify + build)
```

### Git Pre-Commit Hooks

To install pre-commit hooks for automatic formatting and linting:

```bash
pip install pre-commit
pre-commit install
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
