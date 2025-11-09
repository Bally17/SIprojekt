#!/bin/sh

echo "⏳ Waiting for DB..."
until nc -z db 5432; do
  sleep 1
done
echo "✅ DB is ready!"

echo "⚙️ Running migrations..."
python manage.py migrate --noinput

echo "👤 Creating default garant..."
python manage.py create_default_garant || echo "⚠️ Failed to create default garant"

echo "🚀 Starting Django..."
python manage.py runserver 0.0.0.0:8000
