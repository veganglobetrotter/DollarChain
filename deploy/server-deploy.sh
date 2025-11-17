#!/usr/bin/env bash
set -euo pipefail

# Use current folder as root dir instead of hardcoding
ROOT_DIR="$(pwd)"
cd "$ROOT_DIR"

echo "Fetching latest..."
git fetch --all --prune
git reset --hard origin/main

if [ ! -f .env.production ]; then
  echo "ERROR: .env.production missing at $ROOT_DIR"
  exit 1
fi

echo "Building and starting containers..."
docker compose pull || true
docker compose up -d --build

echo "Prune unused images..."
docker image prune -f || true

echo "Done."
