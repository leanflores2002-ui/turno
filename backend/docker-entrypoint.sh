#!/bin/sh
set -e

# Ensure PORT is set (Railway provides it)
export PORT="${PORT:-8000}"

echo "[entrypoint] Starting TurnoPlus backend on port ${PORT}"

if [ "${RUN_MIGRATIONS:-0}" != "0" ]; then
  echo "[entrypoint] Running Alembic migrations..."
  set +e
  alembic upgrade head
  MIG_STATUS=$?
  set -e
  if [ "$MIG_STATUS" -ne 0 ]; then
    echo "[entrypoint] WARNING: Alembic migrations failed (exit $MIG_STATUS). Continuing to start API."
  fi
else
  echo "[entrypoint] Skipping Alembic migrations (RUN_MIGRATIONS=${RUN_MIGRATIONS:-0})"
fi

echo "[entrypoint] Launching Uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT}"
