from __future__ import annotations

from contextlib import contextmanager
from typing import Callable, Generator, Iterator, Optional

from alembic import command
from alembic.config import Config
from sqlalchemy import Engine, create_engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker

from app.db.base import Base
from app.db.settings import DatabaseSettings, get_database_settings


class DBBroker:
    """Coordinates database engine, sessions, and migrations."""

    def __init__(
        self,
        settings: Optional[DatabaseSettings] = None,
    ) -> None:
        self._settings = settings or get_database_settings()
        self._engine: Engine = create_engine(
            self._settings.url,
            future=True,
            echo=self._settings.echo,
            pool_pre_ping=self._settings.pool_pre_ping,
        )
        self._session_factory: sessionmaker[Session] = sessionmaker(
            bind=self._engine,
            expire_on_commit=False,
            autoflush=False,
            autocommit=False,
            future=True,
        )

    @property
    def engine(self) -> Engine:
        return self._engine

    def create_all(self) -> None:
        Base.metadata.create_all(self._engine)

    def drop_all(self) -> None:
        Base.metadata.drop_all(self._engine)

    @contextmanager
    def session(self) -> Iterator[Session]:
        session: Session = self._session_factory()
        try:
            yield session
            session.commit()
        except SQLAlchemyError:
            session.rollback()
            raise
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    def dependency(self) -> Callable[[], Generator[Session, None, None]]:
        def _dependency() -> Generator[Session, None, None]:
            with self.session() as session:
                yield session

        return _dependency

    # ----- Alembic integration -----
    def _alembic_config(self) -> Config:
        cfg = Config(str(self._settings.alembic_ini_path))
        cfg.set_main_option("sqlalchemy.url", self._settings.url)
        return cfg

    def upgrade(self, revision: str = "head") -> None:
        command.upgrade(self._alembic_config(), revision)

    def downgrade(self, revision: str) -> None:
        command.downgrade(self._alembic_config(), revision)

    def revision(self, message: str, *, autogenerate: bool = True) -> None:
        command.revision(
            self._alembic_config(), message=message, autogenerate=autogenerate
        )

    def current(self) -> None:
        command.current(self._alembic_config())

    def history(self) -> None:
        command.history(self._alembic_config())


_dbbroker: Optional[DBBroker] = None


def get_dbbroker() -> DBBroker:
    global _dbbroker
    if _dbbroker is None:
        _dbbroker = DBBroker()
    return _dbbroker


def get_session() -> Generator[Session, None, None]:
    broker = get_dbbroker()
    with broker.session() as session:
        yield session


__all__ = [
    "DBBroker",
    "get_dbbroker",
    "get_session",
]
