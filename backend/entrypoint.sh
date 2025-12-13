#!/bin/sh
set -e

# Basic Gunicorn tuning can be set via env; names stay unchanged.
: "${GUNICORN_WORKERS:=3}"
: "${GUNICORN_TIMEOUT:=120}"
: "${GUNICORN_BIND:=0.0.0.0:8000}"

echo "⏳ Waiting for DB..."
until nc -z db 5432; do
  sleep 1
done
echo "✅ DB is ready!"

echo "⚙️ Running migrations..."
python manage.py migrate --noinput

echo "👤 Creating default garant..."
python manage.py create_default_garant || echo "⚠️ Failed to create default garant"

echo "📦 Collecting static files..."
python manage.py collectstatic --noinput

echo "🚀 Starting Gunicorn..."
exec gunicorn core.wsgi:application \
  --bind "$GUNICORN_BIND" \
  --workers "$GUNICORN_WORKERS" \
  --timeout "$GUNICORN_TIMEOUT"
