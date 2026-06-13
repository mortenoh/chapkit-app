# chapkit-app — read-only DHIS2 explorer for CHAP model services (chapkit)
# App runs on http://localhost:3000, CORS proxy on http://localhost:7070
# Sign in with server http://localhost:7070 (proxies to local DHIS2 on :8080).
# Requires a DHIS2 "route" with code `chap` pointing at chap-core (http://chap:8000/**).

.DEFAULT_GOAL := help

.PHONY: help install start build test lint format typecheck check clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	pnpm install

start: ## Run dev server against local DHIS2 on :8080
	pnpm start:local

build: ## Production build (build/bundle/*.zip)
	pnpm build

test: ## Run tests
	pnpm test

lint: ## Lint + format check
	pnpm lint

format: ## Auto-format
	pnpm format

typecheck: ## TypeScript typecheck only
	pnpm exec tsc --noEmit

check: lint typecheck ## Lint + typecheck

clean: ## Remove build artifacts and caches
	rm -rf build .d2/shell/dist node_modules/.vite
