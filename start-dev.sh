#!/bin/bash -eu

echo "Installing/updating npm dependencies..."
npm install

echo "Starting Vite dev server..."
exec npx vite --host 0.0.0.0 --port 8989
