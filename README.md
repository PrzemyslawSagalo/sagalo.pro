# sagalo.pro

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Deploy Hugo site to Pages](https://github.com/PrzemyslawSagalo/sagalo.pro/actions/workflows/hugo.yaml/badge.svg)](https://github.com/PrzemyslawSagalo/sagalo.pro/actions/workflows/hugo.yaml)

Personal engineering hub, architecture deep dives, and operational runbooks built with [Hugo](https://gohugo.io/) and the [Hextra](https://github.com/imfing/hextra) theme, published at [sagalo.pro](https://sagalo.pro/).

## Banner

A clean visual background banner (1584x396) without baked-in text, featuring high-contrast dark tones, ambient glows, and geometric concentric rings. On `sagalo.pro`, text is layered via HTML/CSS; the clean image below is ready for direct use on social profiles or custom overlays:

- **Download**: [Clean PNG](static/images/banner.png) | [Clean Vector SVG](static/images/banner.svg)

![Background Banner](static/images/banner.png)

## Development

Prerequisites:
- [Hugo Extended](https://gohugo.io/installation/) (`>= 0.146.0`)
- [Go](https://go.dev/) (`>= 1.21`)
- [Python](https://www.python.org/) (`>= 3.10`) & `pre-commit` (for code quality hooks)
- [Node.js](https://nodejs.org/) (`>= 18`) (for markdownlint via pre-commit)

### Quick Start with Make

```bash
make help     # Display available workflow targets
make serve    # Launch local development server with draft rendering
make lint     # Run pre-commit hooks (yamllint, markdownlint, whitespace)
make verify   # Verify Go and Hugo module integrity
make build    # Production build with garbage collection and minification
make test     # Run all quality checks (lint + verify + build)
```

### Git Pre-Commit Hooks

```bash
pip install pre-commit
pre-commit install
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
