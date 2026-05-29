#!/bin/sh
set -e

echo "[api] Checking Aerich migrations..."

# Если директории migrations нет — инициализируем
if [ ! -d "/app/migrations" ]; then
    echo "[api] Initializing Aerich..."
    aerich init -t app.core.database.TORTOISE_ORM
    echo "[api] Creating initial migration..."
    aerich init-db
fi

echo "[api] Applying pending migrations..."
aerich upgrade

echo "[api] Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
