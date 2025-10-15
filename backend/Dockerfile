# Upravte backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Inštalácia systémových závislostí - OPRAVENÉ
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Kopírovanie a inštalácia závislostí
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kopírovanie projektu
COPY . .

# Vytvorenie priečinkov
RUN mkdir -p static media

# Nastavenie pre Docker
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=core.settings
ENV DOCKER_CONTAINER=True

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate && python manage.py runserver 0.0.0.0:8000"]

