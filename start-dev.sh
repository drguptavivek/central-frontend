#!/bin/bash -eu
set -o pipefail
shopt -s inherit_errexit || true

echo "Installing/updating npm dependencies..."
npm install

echo "Starting Vite dev server..."
exec npx vite --host 0.0.0.0 --port 8989
