# syntax=docker/dockerfile:1

FROM python:3.13-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install dependencies
COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install -r /app/requirements.txt

# Copy app source
COPY . /app

# Ensure src is on PYTHONPATH so `app.*` imports resolve
ENV PYTHONPATH=/app/src

# Railway provides $PORT
ENV PORT=8000
EXPOSE 8000

# Run migrations, then start API
CMD sh -c "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"

