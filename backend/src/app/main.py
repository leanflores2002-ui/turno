from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.api.v1 import api_v1_router


def _get_allowed_origins() -> list[str]:
    env_value = os.getenv("CORS_ALLOWED_ORIGINS", "").strip()
    if env_value:
        return [o.strip() for o in env_value.split(",") if o.strip()]
    # fallback a orígenes locales durante desarrollo
    return [
        "http://localhost:4200",
        "http://127.0.0.1:4200",
    ]


def create_app() -> FastAPI:
    app = FastAPI(title="TurnoPlus API", version="0.1.0")

    allowed_origins = _get_allowed_origins()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/healthz")
    def healthz():
        return {"status": "ok"}

    app.include_router(api_v1_router, prefix="/api/v1")
    return app


app = create_app()
