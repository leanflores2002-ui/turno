# syntax=docker/dockerfile:1

FROM python:3.13-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Build in a way that works from repo root OR from backend/ as context
WORKDIR /tmp/build
COPY . /tmp/build

WORKDIR /app
RUN set -eux; \
    if [ -f /tmp/build/backend/requirements.txt ]; then \
        # Context is repo root; copy backend/ contents
        cp -r /tmp/build/backend/. /app; \
    else \
        # Context is already backend/
        cp -r /tmp/build/. /app; \
    fi; \
    pip install --upgrade pip; \
    pip install -r /app/requirements.txt

# Ensure src is on PYTHONPATH so `app.*` imports resolve
ENV PYTHONPATH=/app/src

# Railway provides $PORT
ENV PORT=8000
EXPOSE 8000

# Run migrations, then start API
CMD sh -c "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"
