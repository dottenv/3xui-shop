#!/bin/sh
set -e

echo "[api] Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
