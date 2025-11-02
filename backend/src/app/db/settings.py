from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel, Field, field_validator


load_dotenv()


class DatabaseSettings(BaseModel):
    """Database configuration loaded from environment variables."""

    url: str = Field(
        default_factory=lambda: os.getenv(
            "DATABASE_URL",
            "mysql+pymysql://turnoplus:turnoplus@localhost:3306/turnoplus",
        )
    )
    echo: bool = Field(default_factory=lambda: os.getenv("DATABASE_ECHO", "0") == "1")
    pool_pre_ping: bool = Field(
        default_factory=lambda: os.getenv("DATABASE_POOL_PRE_PING", "1") != "0"
    )
    alembic_ini_path: Path = Field(
        default_factory=lambda: Path(
            os.getenv("ALEMBIC_INI_PATH", Path(__file__).resolve().parents[3] / "alembic.ini")
        )
    )

    @field_validator("url")
    @classmethod
    def _validate_url(cls, value: str) -> str:
        if "://" not in value:
            raise ValueError("DATABASE_URL must be a valid SQLAlchemy connection URL")
        return value


@lru_cache(maxsize=1)
def get_database_settings() -> DatabaseSettings:
    return DatabaseSettings()


__all__ = ["DatabaseSettings", "get_database_settings"]
