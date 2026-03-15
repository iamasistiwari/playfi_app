#!/bin/sh
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Activate venv and run migrations + collectstatic
echo "Making migrations..."
cd primary-backend
./venv/bin/python manage.py makemigrations --noinput
echo "Running migrations..."
./venv/bin/python manage.py migrate --noinput
echo "Collecting static files..."
./venv/bin/python manage.py collectstatic --noinput
cd "$DIR"

# Start pm2
echo "Starting pm2..."
pm2 start ecosystem.config.js

# Save process list so pm2 resurrect works on reboot
pm2 save

# Setup startup hook (idempotent — safe to run multiple times)
pm2 startup 2>/dev/null || true

echo ""
echo "Done. Backend running at http://localhost:8000"
echo "  pm2 logs playfi-backend   — view logs"
echo "  pm2 monit                 — dashboard"
echo "  pm2 restart playfi-backend — restart"
echo "  pm2 stop playfi-backend   — stop"
