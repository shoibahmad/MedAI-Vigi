.PHONY: install install-dev setup build test test-py test-js ci-fresh lint typecheck audit clean run docker-build docker-run reproduce

PYTHON ?= python
PIP ?= pip
PYTEST ?= pytest

install:
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt

install-dev:
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements-dev.txt
	npm ci

setup: install-dev build

build:
	$(PYTHON) scripts/data_generator.py
	$(PYTHON) scripts/model_trainer.py
	$(PYTHON) scripts/run_ablation.py

test: test-py test-js

test-py:
	$(PYTEST) tests/ --cov=. --cov-report=term-missing --cov-report=xml --cov-fail-under=80

test-js:
	node --test tests/js/*.test.js

ci-fresh: build test

lint:
	ruff check .
	black --check .

typecheck:
	mypy app.py config.py schemas.py routes services utils scripts/model_trainer.py scripts/run_ablation.py

audit:
	pip-audit -r requirements.txt

reproduce:
	$(PYTHON) scripts/data_generator.py
	$(PYTHON) scripts/model_trainer.py
	$(PYTHON) scripts/run_ablation.py
	$(PYTHON) scripts/eda_report.py
	$(PYTHON) scripts/evaluate_model.py
	$(PYTHON) scripts/experiment_tracker.py

run:
	$(PYTHON) app.py

docker-build:
	docker build -t phenorx:latest .

docker-run:
	docker-compose up -d

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache .coverage coverage.xml .mypy_cache .ruff_cache
