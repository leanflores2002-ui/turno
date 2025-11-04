<<<<<<< HEAD
# TurnoPlus Backend

## Requisitos

1. Python 3.13 gestionado con [uv](https://github.com/astral-sh/uv).
2. Base de datos MySQL accesible.

Instala dependencias:

```bash
cd backend
uv pip install -r pyproject.toml
```

## Configuración de la base de datos

La capa de infraestructura se centraliza en `app.db.DBbroker`. La aplicación lee la configuración desde variables de entorno que normalmente definimos en `backend/.env` (cargado automáticamente por `python-dotenv`):

- `DATABASE_URL`: URL de conexión SQLAlchemy hacia la base externa proporcionada por el equipo (sincroniza migrations y runtime).
- `DATABASE_ECHO`: Define si SQLAlchemy escribe SQL (`1` para habilitar).
- `DATABASE_POOL_PRE_PING`: Controla `pool_pre_ping` (`0` para deshabilitar).
- `ALEMBIC_INI_PATH`: Permite sobreescribir la ruta de `alembic.ini`.

Ejemplo mínimo (`backend/.env`):

```env
DATABASE_URL=mysql+pymysql://usuario:password@host:3306/turnoplus
```

El broker expone:

- `DBBroker.session()` como context manager para transacciones explícitas.
- `app.db.get_session` para usar como dependencia FastAPI.
- Utilidades de migración (`upgrade`, `downgrade`, `revision`, `history`, `current`).

## Migraciones

Se utiliza Alembic. Los archivos viven en `backend/alembic/`.

```bash
cd backend
uv run alembic revision -m "describe change"
uv run alembic upgrade head
```

El archivo `alembic/env.py` carga las configuraciones desde `DATABASE_URL` y descubre modelos a través de `app.db.Base`.

## Próximos pasos sugeridos

1. Crear modelos ORM dentro de `app/models/` que hereden de `app.db.Base`.
2. Generar la migración inicial con Alembic (`alembic revision --autogenerate`).
3. Reemplazar servicios en memoria por repositorios que utilicen `DBBroker`.
=======
# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/d3ce8358-8d8b-4c9f-9c89-8b5bebb1ce03

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/d3ce8358-8d8b-4c9f-9c89-8b5bebb1ce03) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/d3ce8358-8d8b-4c9f-9c89-8b5bebb1ce03) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
>>>>>>> parent of 3a80cbf (fin)
