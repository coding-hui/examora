GOCACHE ?= /tmp/examora-gocache

.PHONY: help deps infra-up infra-down go-check api worker sandbox

help:
	@echo "Available targets:"
	@echo "  make deps        - install frontend dependencies"
	@echo "  make infra-up    - start postgres and redis"
	@echo "  make infra-down  - stop postgres and redis"
	@echo "  make go-check    - run Go tests"
	@echo "  make api         - run the Go API service"
	@echo "  make worker      - run the Go judge worker"
	@echo "  make sandbox     - run the Go sandbox service"

deps:
	pnpm install

infra-up:
	docker compose -f deploy/docker-compose.yml up -d

infra-down:
	docker compose -f deploy/docker-compose.yml down

go-check:
	GOCACHE=$(GOCACHE) go test ./...

api:
	GOCACHE=$(GOCACHE) go run ./cmd/api

worker:
	GOCACHE=$(GOCACHE) go run ./cmd/worker

sandbox:
	GOCACHE=$(GOCACHE) go run ./cmd/sandbox
