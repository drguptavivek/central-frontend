#!/bin/bash -eu

echo "Installing/updating npm dependencies..."
npm install

echo "Starting Vite dev server..."
exec npm run dev
