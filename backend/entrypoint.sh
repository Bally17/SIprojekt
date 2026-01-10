#!/bin/sh
set -e

# Basic Gunicorn tuning can be set via env; names stay unchanged.
: "${GUNICORN_WORKERS:=3}"
: "${GUNICORN_TIMEOUT:=120}"
: "${GUNICORN_BIND:=0.0.0.0:8000}"
: "${SEEDING_ENABLED:=0}"
: "${SEED_EXTERNAL_CLIENT:=0}"
: "${CREATE_DEFAULT_GARANT:=0}"

echo "DB: waiting..."
until nc -z db 5432; do
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
