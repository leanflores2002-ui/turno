from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.broker import DBBroker, get_dbbroker
from app.models.office import Office as OfficeModel
from app.schemas.office import Office, OfficeCreate, OfficeUpdate


class OfficesService:
    """Service layer backed by the relational database for offices."""

    def __init__(self, session: Session | None = None, *, broker: DBBroker | None = None) -> None:
        self._session = session
        self._broker = broker

    # ------------------------------------------------------------------
    def list(self) -> list[Office]:
        with self._session_scope() as session:
            stmt = select(OfficeModel)
            offices = session.scalars(stmt).all()
            return [self._to_schema(model) for model in offices]

    def get(self, office_id: int) -> Office | None:
        with self._session_scope() as session:
            model = session.get(OfficeModel, office_id)
            if not model:
                return None
            return self._to_schema(model)

    def create(self, data: OfficeCreate) -> Office:
        payload = data.model_dump()
        office = OfficeModel(**payload)

        with self._session_scope() as session:
            session.add(office)
            try:
                session.flush()
            except IntegrityError as exc:  # pragma: no cover - relies on DB constraint
                session.rollback()
                raise ValueError("Office could not be created (duplicate code)") from exc
            return self._to_schema(office)

    def update(self, office_id: int, data: OfficeUpdate) -> Office | None:
        changes = data.model_dump(exclude_unset=True)
        with self._session_scope() as session:
            office = session.get(OfficeModel, office_id)
            if not office:
                return None

            for field, value in changes.items():
                if hasattr(office, field):
                    setattr(office, field, value)

            try:
                session.flush()
            except IntegrityError as exc:  # pragma: no cover - relies on DB constraint
                session.rollback()
                raise ValueError("Office could not be updated (duplicate code)") from exc
            return self._to_schema(office)

    def delete(self, office_id: int) -> bool:
        with self._session_scope() as session:
            office = session.get(OfficeModel, office_id)
            if not office:
                return False

            session.delete(office)
            session.flush()
            return True

    # ------------------------------------------------------------------
    @contextmanager
    def _session_scope(self) -> Iterator[Session]:
        if self._session is not None:
            yield self._session
        else:
            broker = self._broker or get_dbbroker()
            with broker.session() as session:
                yield session

    @staticmethod
    def _to_schema(model: OfficeModel) -> Office:
        return Office(
            id=model.id,
            code=model.code,
            name=model.name,
            address=model.address,
        )
