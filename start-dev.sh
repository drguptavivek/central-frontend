#!/bin/bash -eu

echo "Installing/updating npm dependencies..."
npm install

mkdir -p .nginx/client_body_temp .nginx/proxy_temp

echo "Starting Vite dev server..."
exec npm run dev
