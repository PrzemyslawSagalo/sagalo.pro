.DEFAULT_GOAL := help

.PHONY: help lint verify build serve test

help:
	@echo "Available commands:"
	@echo "  make help    - Display available workflow targets"
	@echo "  make lint    - Run pre-commit checks on all files"
	@echo "  make verify  - Verify Go and Hugo module dependencies"
	@echo "  make build   - Build site with Hugo (--gc --minify)"
	@echo "  make serve   - Run local development Hugo server"
	@echo "  make test    - Run all quality checks (lint + verify + build)"

lint:
	pre-commit run --all-files

verify:
	go mod verify
	hugo mod verify

build:
	hugo --gc --minify

serve:
	hugo server --buildDrafts --disableFastRender

test: lint verify build
