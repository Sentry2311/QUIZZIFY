#!/bin/sh
# Runs the API and nginx together. The API keeps its usual port 5000 on
# loopback; nginx binds the public port the platform gives us (Railway sets
# $PORT, local Docker falls back to 8080).
set -e

PUBLIC_PORT="${PORT:-8080}"
sed "s/__PORT__/${PUBLIC_PORT}/" /etc/nginx/quizzify.conf.template > /etc/nginx/nginx.conf

PORT=5000 node /app/src/index.js &
API_PID=$!

# If the API dies, take nginx down too so the platform restarts the container
# instead of serving a broken app.
(
  while kill -0 "$API_PID" 2>/dev/null; do sleep 5; done
  echo "[start] API exited, stopping nginx"
  kill -TERM 1 2>/dev/null || true
) &

exec nginx -g 'daemon off;'
