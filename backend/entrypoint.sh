#!/bin/sh
set -e

# Basic Gunicorn tuning can be set via env; names stay unchanged.
: "${GUNICORN_WORKERS:=3}"
: "${GUNICORN_TIMEOUT:=120}"
: "${GUNICORN_BIND:=0.0.0.0:8000}"
: "${SEEDING_ENABLED:=0}"
: "${SEED_EXTERNAL_CLIENT:=0}"
: "${CREATE_DEFAULT_GARANT:=0}"
: "${DB_HOST:=db}"
: "${DB_PORT:=5432}"
: "${DB_WAIT_TIMEOUT:=60}"

echo "DB: waiting..."
start_ts=$(date +%s)
while ! nc -z "$DB_HOST" "$DB_PORT"; do
  now_ts=$(date +%s)
  if [ $((now_ts - start_ts)) -ge "$DB_WAIT_TIMEOUT" ]; then
    echo "DB: timeout after ${DB_WAIT_TIMEOUT}s"
    exit 1
  fi
  sleep 1
done
echo "DB: ready"

echo "Migrations: running"
python manage.py migrate --noinput

if [ "$SEEDING_ENABLED" = "1" ]; then
  if [ "$SEED_EXTERNAL_CLIENT" = "1" ]; then
    echo "Seeding: external OAuth client"
    python manage.py seed_external_client || echo "Seeding: external OAuth client failed"
  else
    echo "Seeding: external OAuth client disabled"
  fi
else
  echo "Seeding: disabled"
fi

if [ "$CREATE_DEFAULT_GARANT" = "1" ]; then
  echo "Garant: ensure default account"
  python manage.py create_default_garant || echo "Garant: setup failed"
else
  echo "Garant: disabled"
fi

echo "Static: collect"
python manage.py collectstatic --noinput

echo "Gunicorn: starting"
exec gunicorn core.wsgi:application \
  --bind "$GUNICORN_BIND" \
  --workers "$GUNICORN_WORKERS" \
  --timeout "$GUNICORN_TIMEOUT"
