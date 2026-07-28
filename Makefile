# ==============================================================================
# Voice Agent - Makefile
# ==============================================================================
# Commands for development, testing, building, and running Docker services.
# ==============================================================================

.PHONY: help setup install-backend install-frontend dev-backend dev-frontend \
        worker build-frontend start-frontend lint lint-frontend docker-up docker-down \
        docker-prod-up docker-prod-down docker-build load-test clean

# Default target: display available commands
help:
	@echo "Voice Agent Management Commands:"
	@echo ""
	@echo "Setup & Dependencies:"
	@echo "  make setup            Install all backend and frontend dependencies"
	@echo "  make install-backend  Install Python backend requirements"
	@echo "  make install-frontend Install Node.js frontend packages"
	@echo ""
	@echo "Development:"
	@echo "  make dev-backend      Run FastAPI backend with live reload (port 8000)"
	@echo "  make dev-frontend     Run Next.js frontend development server (port 3000)"
	@echo "  make worker           Run Celery background worker"
	@echo ""
	@echo "Build & Production:"
	@echo "  make build-frontend   Build Next.js production web app"
	@echo "  make start-frontend   Start Next.js production server"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint             Run frontend and backend linters"
	@echo "  make lint-frontend    Run ESLint on frontend"
	@echo ""
	@echo "Docker Management:"
	@echo "  make docker-up        Start development containers (docker-compose)"
	@echo "  make docker-down      Stop development containers"
	@echo "  make docker-prod-up   Start production containers (PostgreSQL, Redis, Celery, Prometheus, Grafana)"
	@echo "  make docker-prod-down Stop production containers"
	@echo "  make docker-build     Rebuild all Docker containers"
	@echo ""
	@echo "Testing & Utilities:"
	@echo "  make load-test        Run WebSocket load test script"
	@echo "  make clean            Remove build artifacts, caches, and temporary files"
	@echo ""

# ------------------------------------------------------------------------------
# Setup & Installation
# ------------------------------------------------------------------------------

setup: install-backend install-frontend

install-backend:
	cd backend && pip install -r requirements.txt

install-frontend:
	cd frontend && npm install

# ------------------------------------------------------------------------------
# Development
# ------------------------------------------------------------------------------

dev-backend:
	cd backend && uvicorn main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

worker:
	cd backend && celery -A worker worker --loglevel=info

# ------------------------------------------------------------------------------
# Build & Production
# ------------------------------------------------------------------------------

build-frontend:
	cd frontend && npm run build

start-frontend:
	cd frontend && npm run start

# ------------------------------------------------------------------------------
# Code Quality & Linting
# ------------------------------------------------------------------------------

lint: lint-frontend

lint-frontend:
	cd frontend && npm run lint

# ------------------------------------------------------------------------------
# Docker Operations
# ------------------------------------------------------------------------------

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-prod-up:
	docker compose -f docker-compose.prod.yml up -d --build

docker-prod-down:
	docker compose -f docker-compose.prod.yml down

docker-build:
	docker compose build

# ------------------------------------------------------------------------------
# Testing & Utilities
# ------------------------------------------------------------------------------

load-test:
	node scripts/load_test.js

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	rm -rf frontend/.next
	rm -rf frontend/out
