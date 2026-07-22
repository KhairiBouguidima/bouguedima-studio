# ===== Stage 1: Build dependencies =====
FROM python:3.14-slim AS builder

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /build

# Install build dependencies (gcc required for bcrypt/psycopg native)
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libc6-dev libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements and install into /install prefix
COPY requirements.txt .
RUN pip install --prefix=/install -r requirements.txt

# ===== Stage 2: Runtime =====
FROM python:3.14-slim

# OCI Image Labels
LABEL org.opencontainers.image.title="Bouguedima Studio Backend" \
      org.opencontainers.image.description="FastAPI backend with PostgreSQL" \
      org.opencontainers.image.vendor="Bouguedima Studio" \
      org.opencontainers.image.source="https://github.com/bouguedima/studio"

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Install runtime PostgreSQL client library (libpq required by psycopg)
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r studio && useradd -r -g studio -d /app -s /sbin/nologin studio

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY --chown=studio:studio . .

# Create directories for logs and uploads
RUN mkdir -p /app/logs /app/uploads && chown -R studio:studio /app/logs /app/uploads

# Switch to non-root user
USER studio

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD sh -c 'python3 -c "import os, urllib.request; urllib.request.urlopen(\"http://localhost:\" + os.environ.get(\"PORT\", \"8000\") + \"/api/services\")"' || exit 1

EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
