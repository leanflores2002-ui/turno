# Despliegue en Railway

Guía para desplegar el monorepo TurnoPlus (FastAPI + Angular) en Railway.

## Arquitectura

- Base de datos: MySQL (plugin de Railway).
- Backend: FastAPI en `backend/` con Uvicorn.
- Frontend: Angular en `frontend/` como sitio estático.

## Requisitos

- Repositorio conectado a Railway (GitHub recomendado).
- Python >= 3.12 (el proyecto fue ajustado para compatibilidad).

## 1) Base de datos

1. En Railway: `New` → `Database` → `MySQL`.
2. Copia la cadena de conexión y construye `DATABASE_URL` con el driver de SQLAlchemy+pymysql:
   ```
   mysql+pymysql://USER:PASSWORD@HOST:PORT/DBNAME
   ```
3. Guarda esa `DATABASE_URL` para usarla en el backend.

## 2) Backend (FastAPI)

1. `New` → `Service` → `Deploy from Repo` → selecciona este repo.
2. En Settings del servicio:
   - Root Directory: `backend`
   - Start Command:
     ```
     uvicorn backend.main:app --host 0.0.0.0 --port $PORT
     ```
   - Healthcheck Path: `/healthz`
3. Variables de entorno:
   - `DATABASE_URL`: pega la URL del paso de MySQL.
   - `CORS_ALLOWED_ORIGINS`: dominio del frontend en producción (CSV si son varios), por ejemplo:
     ```
     https://<TU-FRONTEND>.up.railway.app
     ```
   - Opcional: `DATABASE_ECHO=0`.
4. Migraciones (opcional, recomendado): en `Deploy Hooks` agrega antes de arrancar:
   ```
   alembic upgrade head
   ```

> Notas
>
> - El backend expone `/healthz` para chequeos.
> - CORS se configura en tiempo de ejecución leyendo `CORS_ALLOWED_ORIGINS` (ver `backend/src/app/main.py`).

## 3) Frontend (Angular)

Opción recomendada: Static Site de Railway.

1. `New` → `Static Site` → selecciona este repo.
2. Settings del sitio estático:
   - Root Directory: `frontend`
   - Build Command:
     ```
     npm ci && npm run build
     ```
   - Publish Directory: `dist/turnoplus/browser` (si no existe, `dist/turnoplus`).
   - Environment Variables (para build):
     - `NG_APP_API_BASE_URL` = `https://<TU-BACKEND>.up.railway.app/api/v1`

La app lee la URL de API de una meta tag en `index.html` que se rellena en build con `NG_APP_API_BASE_URL` vía el script `frontend/scripts/inject-api-base-url.js` (ejecutado en `postbuild`). Si la variable no está presente, se usará `http://localhost:8000/api/v1`.

## 4) Verificación

- Backend: `GET https://<TU-BACKEND>.up.railway.app/healthz` → `{"status":"ok"}`.
- Frontend: `https://<TU-FRONTEND>.up.railway.app` debe cargar y consumir la API.
- Si hay errores CORS, revisa `CORS_ALLOWED_ORIGINS` y la URL de API del frontend.

## Referencias de código

- CORS dinámico: `backend/src/app/main.py`.
- Inyección de API URL en frontend: `frontend/src/index.html`, `frontend/scripts/inject-api-base-url.js`, `frontend/src/app/core/config/api.config.ts`.

