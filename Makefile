.DEFAULT_GOAL := help

.PHONY: help lint verify build serve preview test

help:
	@echo "Available commands:"
	@echo "  make help     - Display available workflow targets"
	@echo "  make lint     - Run pre-commit checks on all files"
	@echo "  make verify   - Run Astro type check (npx astro check)"
	@echo "  make build    - Build site with Astro (npm run build)"
	@echo "  make serve    - Run local Astro dev server (npm run dev)"
	@echo "  make preview  - Preview production build locally (npm run preview)"
	@echo "  make test     - Run all quality checks (lint + verify + build)"

lint:
	pre-commit run --all-files

verify:
	npx astro check

build:
	npm run build

serve:
	npm run dev

preview:
	npm run preview

test: lint verify build
