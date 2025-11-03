#!/bin/sh
set -e

# Ensure PORT is set (Railway provides it)
export PORT="${PORT:-8000}"

echo "[entrypoint] Starting TurnoPlus backend on port ${PORT}"

if [ "${RUN_MIGRATIONS:-1}" != "0" ]; then
  echo "[entrypoint] Running Alembic migrations..."
  if ! alembic upgrade head; then
    echo "[entrypoint] WARNING: Alembic migrations failed. Continuing to start API."
  fi
else
  echo "[entrypoint] Skipping Alembic migrations (RUN_MIGRATIONS=${RUN_MIGRATIONS})"
fi

echo "[entrypoint] Launching Uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT}"

