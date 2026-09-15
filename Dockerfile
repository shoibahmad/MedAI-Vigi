# PhenoRx - multi-stage build
#
# Render's native Python runtime does not provide Node, and the frontend is a
# Vite build, so the image builds the SPA in its own stage and copies the output
# into the Python runtime. That also keeps Node out of the final image.
#
# The trained model is copied from the repo rather than retrained during the
# build: training takes ~5 minutes, needs a 50 MB intermediate dataset, and
# produces a different model than the one the application was tested against.
#
# Python 3.13 on purpose: models/adr_model.pkl was pickled under numpy 2.3 /
# scikit-learn 1.7, and a numpy 2.x pickle cannot be loaded by numpy 1.x. The
# pins in requirements.txt and this base image have to stay in step with the
# environment that trained the model.

# ---------------------------------------------------------------- 1. frontend
FROM node:20-alpine AS frontend

WORKDIR /client

# Install against the lockfile first so this layer caches until deps change.
COPY client/package.json client/package-lock.json ./
RUN npm ci

COPY client/ ./
RUN npm run build


# ------------------------------------------------------------ 2. python deps
FROM python:3.13-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc g++ \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN python -m venv /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir --upgrade pip \
    && /opt/venv/bin/pip install --no-cache-dir -r requirements.txt


# ---------------------------------------------------------------- 3. runtime
FROM python:3.13-slim AS runtime

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
        curl \
    && rm -rf /var/lib/apt/lists/*

ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    FLASK_ENV=production \
    PORT=5000

COPY --from=builder /opt/venv /opt/venv

# Application code. Only what the service actually needs at runtime; tests,
# scripts, and docs are excluded by .dockerignore.
COPY app.py config.py schemas.py ./
COPY routes/ ./routes/
COPY services/ ./services/
COPY utils/ ./utils/
COPY config/ ./config/

# Trained artifacts. The build fails loudly here if Git LFS pointers were
# checked out instead of the real files.
COPY models/ ./models/

# Built SPA. routes/views.py serves this from client/dist.
COPY --from=frontend /client/dist ./client/dist

# Fail the build rather than the healthcheck if the artifacts are wrong.
#
# This actually loads the model rather than just checking the file size. A size
# check alone passes on a pickle written by an incompatible numpy, which then
# fails at runtime and leaves the service permanently degraded.
RUN python -c "import sys; from services.ml_service import MLService; svc = MLService.get_instance(); sys.exit('model failed to load inside the image - check the numpy/scikit-learn pins in requirements.txt against the environment that trained it') if not svc.is_ready() else print('model loads OK'); " && test -f client/dist/index.html || (echo 'client/dist/index.html missing' && exit 1)

RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -fsS "http://localhost:${PORT}/live" || exit 1

# Shell form so ${PORT} expands - Render assigns the port at runtime.
# gthread because the report page fires three concurrent LLM calls, each of which
# blocks its worker for tens of seconds.
CMD gunicorn app:app \
    --bind "0.0.0.0:${PORT}" \
    --workers 1 \
    --threads 4 \
    --worker-class gthread \
    --timeout 180 \
    --access-logfile - \
    --error-logfile - \
    --log-level info
