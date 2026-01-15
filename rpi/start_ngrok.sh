#!/bin/bash
# start_ngrok.sh — Start ngrok tunnel for the RPi Flask app

set -euo pipefail

PORT="${PORT:-8000}"
NGROK_AUTH_TOKEN="${NGROK_AUTH_TOKEN:-}"
BACKGROUND="${BACKGROUND:-false}"

if [ -n "$NGROK_AUTH_TOKEN" ]; then
  echo "Setting ngrok auth token..."
  ngrok config add-authtoken "$NGROK_AUTH_TOKEN"
fi

echo "Starting ngrok tunnel on port $PORT..."
if [ "$BACKGROUND" = "true" ]; then
  nohup ngrok http "$PORT" > /dev/null 2>&1 &
  echo "Ngrok started in background. PID: $!"
else
  ngrok http "$PORT"
fi