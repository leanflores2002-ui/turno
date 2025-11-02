# Despliegue en Railway (Backend + Frontend)

Este repo tiene dos partes:
- Backend: FastAPI + SQLAlchemy + Alembic (`backend/`)
- Frontend: Angular (`frontend/`)

Se agregaron archivos para un despliegue simple en Railway usando Docker por servicio.

## Qué cambié en el proyecto
- CORS configurable por env: `ALLOWED_ORIGINS` en `backend/src/app/main.py`.
- Backend `backend/Dockerfile` y `backend/requirements.txt`.
- Frontend `frontend/Dockerfile`, `frontend/nginx.conf`.
- Frontend soporta URL de API en runtime mediante `env.js`:
  - Se agrega `<script src="/env.js"></script>` en `frontend/src/index.html`.
  - `frontend/src/app/core/config/api.config.ts` ahora lee `window.__env.API_BASE_URL` y cae en `http://localhost:8000/api/v1` en dev.
  - `frontend/docker-entrypoint.d/99-env.sh` genera `env.js` en el contenedor usando `API_BASE_URL`.

## Servicios a crear en Railway
1) Base de datos MySQL (plugin de Railway) o una instancia externa compatible.
2) Backend (carpeta `backend/`, usa Dockerfile incluido).
3) Frontend (carpeta `frontend/`, usa Dockerfile incluido).

> Nota: Por defecto el backend espera MySQL via `pymysql`. Si prefieres Postgres, te indico al final cómo cambiarlo.

## Variables de entorno
- Backend
  - `DATABASE_URL`: cadena SQLAlchemy, p.ej. `mysql+pymysql://usuario:pass@host:3306/turnoplus`.
    - Si usas el plugin de MySQL en Railway, copia sus credenciales y construye la URL anterior.
  - `ALLOWED_ORIGINS`: lista separada por comas con los orígenes permitidos, por ej.: `https://TU_FRONTEND.up.railway.app`.
- Frontend
  - `API_BASE_URL`: URL base pública del backend, por ej.: `https://TU_BACKEND.up.railway.app/api/v1`.

## Pasos en Railway
1. Sube estos cambios a GitHub.
2. Crea un proyecto en Railway.
3. Añade un servicio de base de datos MySQL (o usa uno existente); apunta/arma tu `DATABASE_URL`.
4. Añade el servicio Backend:
   - Deploy from GitHub → selecciona el repo y la carpeta `backend/` (monorepo).
   - Railway detectará el `Dockerfile` y expondrá el puerto `$PORT` (internamente usamos 8000).
   - Variables de entorno del Backend:
     - `DATABASE_URL` (de tu DB).
     - `ALLOWED_ORIGINS` = `https://TU_FRONTEND.up.railway.app`.
   - Opcional: configura healthcheck a `/healthz`.
5. Añade el servicio Frontend:
   - Deploy from GitHub → carpeta `frontend/`.
   - Variables de entorno del Frontend:
     - `API_BASE_URL` = `https://TU_BACKEND.up.railway.app/api/v1`.
6. Espera el build y el deploy de ambos servicios. Verifica:
   - Backend: `https://TU_BACKEND.up.railway.app/healthz` → `{ "status": "ok" }`.
   - Frontend: carga la app y revisa en DevTools que las llamadas `fetch`/`HttpClient` vayan a tu `API_BASE_URL`.
7. Si ves errores de CORS, revisa `ALLOWED_ORIGINS` (origen exacto del frontend, sin barras finales) y re‑deploy del backend.

## Notas
- Migraciones Alembic: el contenedor del backend ejecuta `alembic upgrade head` antes de iniciar Uvicorn.
- Local dev no cambia: sigue apuntando a `http://localhost:8000/api/v1` si `window.__env.API_BASE_URL` no está definida.
- Postgres (opcional):
  - Cambia `DATABASE_URL` a `postgresql+psycopg://usuario:pass@host:5432/db`.
  - Añade `psycopg[binary]` a `backend/requirements.txt` y elimina `pymysql` si ya no usas MySQL.

