# SIprojekt

SIprojekt is a full-stack web application for managing internships (students, companies, and guarantors). The system provides authentication, internship workflows, document handling, and notifications with a modern Next.js frontend and a Django REST backend.

## Tech Stack

Backend
- Python 3.11, Django 5
- Django REST Framework + SimpleJWT
- PostgreSQL 17, Redis
- Gunicorn + WhiteNoise

Frontend
- Next.js 15 (App Router)
- React 19
- TanStack Query
- Tailwind CSS

Infrastructure
- Docker + Docker Compose
- Nginx (dev proxy)

## Repository Layout

- backend/        Django project and apps
- frontend/       Next.js application
- docs/           Sphinx documentation
- nginx/          Nginx config for local dev
- docker-compose.yml  Local dev stack

## Local Development (Docker)

1) Start the stack (fast path)

   docker compose up

2) If you changed dependencies or Dockerfiles

   docker compose up --build

3) Services
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api
- Postgres: localhost:5433

The backend runs migrations and collectstatic automatically on container start (see backend/entrypoint.sh).

## Local Development (Host)

Requirements
- Node.js 22.14.0 and npm 11.6.1 (see package.json engines)
- Python 3.11
- PostgreSQL and Redis

Frontend
- npm install
- npm run dev --workspace frontend

Backend
- python -m venv .venv && .venv/Scripts/activate
- pip install -r backend/requirements.txt
- python backend/manage.py migrate
- python backend/manage.py runserver

## Common Tasks

- Stop containers: docker compose down
- Rebuild only one service: docker compose up --build frontend
- Remove volumes (reset DB): docker compose down -v

## Environment Variables

Backend environment is loaded from backend/.env (already in repo). Common values:
- DEBUG
- SECRET_KEY
- ALLOWED_HOSTS
- FRONTEND_URL
- DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
- REDIS_URL
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET

Frontend
- NEXT_PUBLIC_API_URL (default: http://localhost:8000/api)

## Scripts

Root scripts (workspace)
- npm run dev
- npm run build
- npm run start
- npm run lint
- npm run format
- npm run i18n:check

Frontend scripts (from frontend/)
- npm run dev
- npm run build
- npm run start
- npm run lint
- npm run typecheck
- npm run format

## Testing

Backend (pytest)
- pytest

Frontend
- npm run lint
- npm run typecheck

## Docs

Generate Sphinx docs
- sphinx-build -b html docs docs/_build/html

See docs/overview.rst and docs/api.rst for module reference.

## Security Notes

- CSP and security headers are enforced in the frontend and backend.
- JWT is used for API authentication (Authorization: Bearer).
- CSRF is enabled in Django but auth uses bearer tokens, not cookies.

## Contributing

- Use consistent formatting (prettier, eslint).
- Run i18n check before committing.
- Keep changes scoped to your feature branch.

## License
MIT License. See LICENSE.
