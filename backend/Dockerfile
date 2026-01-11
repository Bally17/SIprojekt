FROM python:3.11-slim

WORKDIR /app

# Prevent apt/debconf interactive prompts during docker build
ENV DEBIAN_FRONTEND=noninteractive
# Optional: silence pip's version check noise
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    libpq-dev \
    netcat-openbsd \
    curl \
    texlive-latex-recommended \
    texlive-fonts-recommended \
    texlive-latex-extra \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Fix CRLF -> LF for entrypoint (Windows line endings) + permissions + create dirs in one layer
RUN sed -i 's/\r$//' /app/entrypoint.sh \
    && chmod +x /app/entrypoint.sh \
    && mkdir -p static media

ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=core.settings.prod
ENV DOCKER_CONTAINER=True

EXPOSE 8000

ENTRYPOINT ["sh", "/app/entrypoint.sh"]
