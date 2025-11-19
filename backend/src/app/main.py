from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_v1_router


def create_app() -> FastAPI:
    app = FastAPI(title="TurnoPlus API", version="0.1.0")

    allowed_origins = [
        "turnoplus.netlify.app",
        "http://127.0.0.1:4200",
    ]

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
