# sagalo.pro

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Deploy Hugo site to Pages](https://github.com/PrzemyslawSagalo/sagalo.pro/actions/workflows/hugo.yaml/badge.svg)](https://github.com/PrzemyslawSagalo/sagalo.pro/actions/workflows/hugo.yaml)

Personal engineering hub, architecture deep dives, and operational runbooks built with [Hugo](https://gohugo.io/) and the [Hextra](https://github.com/imfing/hextra) theme, published at [sagalo.pro](https://sagalo.pro/).

## Development

Prerequisites:
- [Hugo Extended](https://gohugo.io/installation/) (`>= 0.146.0`)
- [Go](https://go.dev/) (`>= 1.21`)

### Local Server
```bash
hugo server --buildDrafts --disableFastRender
```

### Production Build
```bash
hugo --gc --minify
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
