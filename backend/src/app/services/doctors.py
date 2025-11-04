from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.db.broker import DBBroker, get_dbbroker
from app.models.doctor import Doctor as DoctorModel
from app.models.enums import UserRole
from app.models.user import User as UserModel
from app.schemas.user import Doctor, DoctorCreate, DoctorUpdate
from app.utils.security import hash_password, verify_password


class DoctorsService:
    """Service layer backed by the relational database for doctor profiles."""

    def __init__(self, session: Session | None = None, *, broker: DBBroker | None = None) -> None:
        self._session = session
        self._broker = broker

    # ------------------------------------------------------------------
    # Public API
    def list(self) -> list[Doctor]:
        with self._session_scope() as session:
            stmt = select(DoctorModel).options(joinedload(DoctorModel.user))
            doctors = session.scalars(stmt).all()
            return [self._to_schema(model) for model in doctors if model.user]

    def get(self, doctor_id: int) -> Doctor | None:
        with self._session_scope() as session:
            model = session.get(DoctorModel, doctor_id)
            if not model or not model.user:
                return None
            return self._to_schema(model)

    def create(self, data: DoctorCreate) -> Doctor:
        payload = data.model_dump()
        password = payload.pop("password")

        user = UserModel(
            email=payload.pop("email"),
            password_hash=hash_password(password),
            is_active=payload.pop("is_active", True),
            is_superuser=payload.pop("is_superuser", False),
            full_name=payload.pop("full_name", None),
            role=UserRole.DOCTOR,
        )
        doctor = DoctorModel(**payload)
        user.doctor_profile = doctor

        with self._session_scope() as session:
            session.add(user)
            try:
                session.flush()
            except IntegrityError as exc:  # pragma: no cover - relies on DB constraint
                session.rollback()
                raise ValueError("Doctor could not be created (duplicate data)") from exc
            return self._to_schema(doctor)

    def update(self, doctor_id: int, data: DoctorUpdate) -> Doctor | None:
        changes = data.model_dump(exclude_unset=True)
        with self._session_scope() as session:
            doctor = session.get(DoctorModel, doctor_id)
            if not doctor or not doctor.user:
                return None

            user = doctor.user

            password = changes.pop("password", None)
            if password:
                user.password_hash = hash_password(password)

            for field in ("email", "is_active", "is_superuser", "full_name"):
                if field in changes and hasattr(user, field):
                    setattr(user, field, changes.pop(field))

            for field, value in changes.items():
                if hasattr(doctor, field):
                    setattr(doctor, field, value)

            session.flush()
            return self._to_schema(doctor)

    def delete(self, doctor_id: int) -> bool:
        with self._session_scope() as session:
            doctor = session.get(DoctorModel, doctor_id)
            if not doctor:
                return False

            user = doctor.user
            session.delete(doctor)
            if user:
                session.delete(user)
            session.flush()
            return True

    def authenticate(self, email: str, password: str) -> tuple[Doctor, str] | None:
        with self._session_scope() as session:
            stmt = (
                select(DoctorModel)
                .join(DoctorModel.user)
                .options(joinedload(DoctorModel.user))
                .where(UserModel.email == email)
            )
            doctor = session.scalars(stmt).first()
            if not doctor or not doctor.user or not doctor.user.is_active:
                return None

            if not verify_password(password, doctor.user.password_hash):
                return None

            return self._to_schema(doctor), f"doctor-token-{doctor.user.id}"

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
    def _to_schema(model: DoctorModel) -> Doctor:
        user = model.user
        if not user:
            raise ValueError("Doctor is missing related user data")
        return Doctor(
            id=user.id,
            email=user.email,
            password="***",
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            full_name=user.full_name,
            specialty=model.specialty,
            license_number=model.license_number,
            years_experience=model.years_experience,
        )
