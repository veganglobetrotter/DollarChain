#!/bin/bash

# move_api.sh
# Safely move serverless API functions from src/api/ to root /api for Vercel

set -e

echo "Starting API relocation..."

# Step 0: Ensure we are in project root (check package.json)
if [ ! -f package.json ]; then
  echo "Error: package.json not found. Please run this script from the project root."
  exit 1
fi

# Step 1: Create /api folder if it doesn't exist
mkdir -p api
echo "✅ /api folder ensured"

# Step 2: Move serverless functions
for file in reserveCredits.js consumeCredits.js releaseCredits.js; do
  src_path="src/api/$file"
  dest_path="api/$file"
  if [ -f "$src_path" ]; then
    mv "$src_path" "$dest_path"
    echo "✅ Moved $file to /api/"
  else
    echo "⚠️ $file not found in src/api/, skipping..."
  fi
done

# Step 3: Remove src/api if empty
if [ -d src/api ] && [ -z "$(ls -A src/api)" ]; then
  rmdir src/api
  echo "✅ Removed empty src/api folder"
fi

# Step 4: Verify
echo "🔍 Verifying moved files..."
for file in reserveCredits.js consumeCredits.js releaseCredits.js; do
  if [ -f "api/$file" ]; then
    echo "✅ api/$file exists"
  else
    echo "❌ api/$file missing"
  fi
done

echo "All done. You can now redeploy to Vercel."
