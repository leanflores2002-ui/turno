from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.api.v1 import api_v1_router


def create_app() -> FastAPI:
    app = FastAPI(title="TurnoPlus API", version="0.1.0")

    env_origins = os.getenv("ALLOWED_ORIGINS", "")
    if env_origins.strip():
        allowed_origins = [o.strip() for o in env_origins.split(",") if o.strip()]
        allow_credentials = True
    else:
        # Fallback for local/dev: allow all without credentials
        allowed_origins = ["*"]
        allow_credentials = False

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=allow_credentials,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/healthz")
    def healthz():
        return {"status": "ok"}

    app.include_router(api_v1_router, prefix="/api/v1")
    
    @app.get("/")
    def root():
        return {
            "status": "ok",
            "service": "TurnoPlus API",
            "version": "0.1.0",
            "docs": "/docs",
            "healthz": "/healthz",
        }
    return app


app = create_app()
