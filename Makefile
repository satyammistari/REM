SHELL := /bin/bash

.PHONY: help dev go worker dashboard seed test test-integration migrate build push lint fmt init-db clean

GREEN := \033[32m
RED := \033[31m
YELLOW := \033[33m
RESET := \033[0m

help:
	@echo -e "$(YELLOW)Available commands:$(RESET)"
	@echo "  make dev              - start all core services natively"
	@echo "  make go               - run Go API only"
	@echo "  make worker           - run Python worker only"
	@echo "  make dashboard        - run Next.js dashboard"
	@echo "  make seed             - run demo seed script"
	@echo "  make test             - run Go unit tests"
	@echo "  make test-integration - run Go integration tests"
	@echo "  make migrate          - run Go migrations"
	@echo "  make build            - build Docker images"
	@echo "  make push             - push Docker images (requires registry config)"
	@echo "  make lint             - lint Go and Python"
	@echo "  make fmt              - format Go and Python"
	@echo "  make init-db          - initialise Qdrant and Neo4j"
	@echo "  make clean            - stop services / clean up"

dev:
	@echo -e "$(GREEN)[dev] Starting Go API, Python worker, and dashboard...$(RESET)"
	@(cd go-api && go run ./cmd/api/main.go) &
	@(cd python-worker && uvicorn main:app --reload --host 0.0.0.0 --port 8001) &
	@(cd dashboard && npm install && npm run dev)

go:
	@echo -e "$(GREEN)[go] Running Go API...$(RESET)"
	cd go-api && go run ./cmd/api/main.go

worker:
	@echo -e "$(GREEN)[worker] Running Python worker...$(RESET)"
	cd python-worker && uvicorn main:app --reload --host 0.0.0.0 --port 8001

dashboard:
	@echo -e "$(GREEN)[dashboard] Running Next.js dashboard...$(RESET)"
	cd dashboard && npm install && npm run dev

seed:
	@echo -e "$(GREEN)[seed] Seeding demo data...$(RESET)"
	cd sdk/python && pip install -e .
	cd .. && python scripts/seed_demo.py

test:
	@echo -e "$(GREEN)[test] Running Go unit tests...$(RESET)"
	cd go-api && go test ./...

test-integration:
	@echo -e "$(GREEN)[integration] Running Go integration tests...$(RESET)"
	cd go-api && go test -tags=integration ./tests/...

migrate:
	@echo -e "$(GREEN)[migrate] Running migrations...$(RESET)"
	cd go-api && go test ./internal/db/postgres -run TestMigrations -v || true

build:
	@echo -e "$(GREEN)[build] Building Docker images...$(RESET)"
	docker build -t rem-go-api:latest ./go-api
	docker build -t rem-python-worker:latest ./python-worker

push:
	@echo -e "$(YELLOW)[push] Implement registry tagging and pushing as needed.$(RESET)"

lint:
	@echo -e "$(GREEN)[lint] Linting Go and Python...$(RESET)"
	cd go-api && golangci-lint run || echo -e "$(YELLOW)Go lint skipped or failed$(RESET)"
	cd python-worker && ruff check . || echo -e "$(YELLOW)Python lint skipped or failed$(RESET)"

fmt:
	@echo -e "$(GREEN)[fmt] Formatting Go and Python...$(RESET)"
	cd go-api && gofmt -w $$(find . -name '*.go')
	cd python-worker && black .

init-db:
	@echo -e "$(GREEN)[init-db] Initialising Qdrant and Neo4j...$(RESET)"
	@[ -f scripts/init_qdrant.py ] && python scripts/init_qdrant.py || echo "init_qdrant.py not found"
	@[ -f scripts/init_neo4j.py ] && python scripts/init_neo4j.py || echo "init_neo4j.py not found"

clean:
	@echo -e "$(GREEN)[clean] Stopping background services (if any).$(RESET)"
	@pkill -f "go run ./cmd/api/main.go" || true
	@pkill -f "uvicorn main:app" || true

