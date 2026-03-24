# Python 3.11 WhatsApp Bot Dockerfile
# Multi-stage build untuk development dan production

FROM python:3.11-slim AS base
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Development stage
FROM base AS development

COPY bot/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install dev tools
RUN pip install --no-cache-dir \
    watchdog \
    debugpy

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

CMD ["python", "-m", "watchdog.tricks", "auto-restart", "--", "python", "main.py"]

# Production stage
FROM base AS production

# Create non-root user
RUN groupadd -g 1000 appgroup \
    && useradd -u 1000 -g appgroup -s /bin/bash appuser

COPY bot/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=appuser:appgroup bot/ .

USER appuser

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["python", "main.py"]
