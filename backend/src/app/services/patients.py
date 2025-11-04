from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.db.broker import DBBroker, get_dbbroker
from app.models.enums import UserRole
from app.models.patient import Patient as PatientModel
from app.models.user import User as UserModel
from app.schemas.user import Patient, PatientCreate, PatientUpdate
from app.utils.security import hash_password, verify_password


class PatientsService:
    """Service layer backed by the relational database for patients."""

    def __init__(self, session: Session | None = None, *, broker: DBBroker | None = None) -> None:
        self._session = session
        self._broker = broker

    # ------------------------------------------------------------------
    # Public API
    def list(self) -> list[Patient]:
        with self._session_scope() as session:
            stmt = select(PatientModel).options(joinedload(PatientModel.user))
            patients = session.scalars(stmt).all()
            return [self._to_schema(model) for model in patients if model.user]

    def get(self, patient_id: int) -> Patient | None:
        with self._session_scope() as session:
            model = session.get(PatientModel, patient_id)
            if not model or not model.user:
                return None
            return self._to_schema(model)

    def create(self, data: PatientCreate) -> Patient:
        payload = data.model_dump()
        password = payload.pop("password")

        user = UserModel(
            email=payload.pop("email"),
            password_hash=hash_password(password),
            is_active=payload.pop("is_active", True),
            is_superuser=payload.pop("is_superuser", False),
            full_name=payload.pop("full_name", None),
            role=UserRole.PATIENT,
        )
        patient = PatientModel(**payload)
        user.patient_profile = patient

        with self._session_scope() as session:
            session.add(user)
            try:
                session.flush()
            except IntegrityError as exc:  # pragma: no cover - relies on DB constraint
                session.rollback()
                raise ValueError("Patient could not be created (duplicate data)") from exc
            return self._to_schema(patient)

    def update(self, patient_id: int, data: PatientUpdate) -> Patient | None:
        changes = data.model_dump(exclude_unset=True)
        with self._session_scope() as session:
            patient = session.get(PatientModel, patient_id)
            if not patient or not patient.user:
                return None

            user = patient.user

            password = changes.pop("password", None)
            if password:
                user.password_hash = hash_password(password)

            for field in ("email", "is_active", "is_superuser", "full_name"):
                if field in changes and hasattr(user, field):
                    setattr(user, field, changes.pop(field))

            for field, value in changes.items():
                if hasattr(patient, field):
                    setattr(patient, field, value)

            session.flush()
            return self._to_schema(patient)

    def delete(self, patient_id: int) -> bool:
        with self._session_scope() as session:
            patient = session.get(PatientModel, patient_id)
            if not patient:
                return False

            user = patient.user
            session.delete(patient)
            if user:
                session.delete(user)
            session.flush()
            return True

    def authenticate(self, email: str, password: str) -> Patient | None:
        with self._session_scope() as session:
            stmt = (
                select(PatientModel)
                .join(PatientModel.user)
                .options(joinedload(PatientModel.user))
                .where(UserModel.email == email)
            )
            patient = session.scalars(stmt).first()
            if not patient or not patient.user or not patient.user.is_active:
                return None

            if not verify_password(password, patient.user.password_hash):
                return None

            return self._to_schema(patient)

    # ------------------------------------------------------------------
    # Internal helpers
    @contextmanager
    def _session_scope(self) -> Iterator[Session]:
        if self._session is not None:
            yield self._session
        else:
            broker = self._broker or get_dbbroker()
            with broker.session() as session:
                yield session

    @staticmethod
    def _to_schema(model: PatientModel) -> Patient:
        user = model.user
        if not user:
            raise ValueError("Patient is missing related user data")
        return Patient(
            id=user.id,
            email=user.email,
            password="***",
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            full_name=user.full_name,
            date_of_birth=model.date_of_birth,
            medical_record_number=model.medical_record_number,
            emergency_contact=model.emergency_contact,
        )
