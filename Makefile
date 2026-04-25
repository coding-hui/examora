.PHONY: help deps infra-up infra-down cargo-check api worker schema

help:
	@echo "Available targets:"
	@echo "  make deps        - install frontend dependencies"
	@echo "  make infra-up    - start postgres and redis"
	@echo "  make infra-down  - stop postgres and redis"
	@echo "  make cargo-check - run cargo check"
	@echo "  make api         - run the API service"
	@echo "  make worker      - run the judge worker"
	@echo "  make schema      - print schema file path"

deps:
	pnpm install

infra-up:
	docker compose -f deploy/docker-compose.yml up -d

infra-down:
	docker compose -f deploy/docker-compose.yml down

cargo-check:
	cargo check

api:
	cargo run -p examora-api

worker:
	cargo run -p examora-judge-worker

schema:
	@echo docs/schema.sql
