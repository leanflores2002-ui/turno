from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.broker import DBBroker, get_dbbroker
from app.models.medical_record import MedicalRecord as MedicalRecordModel
from app.schemas.medical_record import MedicalRecord, MedicalRecordCreate, MedicalRecordUpdate
from app.services.doctors import DoctorsService
from app.services.patients import PatientsService


class MedicalRecordsService:
    """Service layer backed by the database for clinical records."""

    def __init__(self, session: Session | None = None, *, broker: DBBroker | None = None) -> None:
        self._session = session
        self._broker = broker

    # ------------------------------------------------------------------
    def list_for_patient(self, patient_id: int) -> list[MedicalRecord]:
        with self._session_scope() as session:
            patients = PatientsService(session)
            if not patients.get(patient_id):
                return []

            stmt = (
                select(MedicalRecordModel)
                .where(MedicalRecordModel.patient_id == patient_id)
                .order_by(MedicalRecordModel.created_at.desc())
            )
            records = session.scalars(stmt).all()
            return [self._to_schema(record) for record in records]

    def list_for_doctor(self, doctor_id: int) -> list[MedicalRecord]:
        with self._session_scope() as session:
            doctors = DoctorsService(session)
            if not doctors.get(doctor_id):
                return []

            stmt = (
                select(MedicalRecordModel)
                .where(MedicalRecordModel.doctor_id == doctor_id)
                .order_by(MedicalRecordModel.created_at.desc())
            )
            records = session.scalars(stmt).all()
            return [self._to_schema(record) for record in records]

    def get(self, record_id: int) -> MedicalRecord | None:
        with self._session_scope() as session:
            record = session.get(MedicalRecordModel, record_id)
            if not record:
                return None
            return self._to_schema(record)

    def create(self, data: MedicalRecordCreate) -> MedicalRecord:
        payload = data.model_dump()
        with self._session_scope() as session:
            patients = PatientsService(session)
            if not patients.get(payload["patient_id"]):
                raise ValueError("Patient not found")

            doctor_id: Optional[int] = payload.get("doctor_id")
            if doctor_id is not None:
                doctors = DoctorsService(session)
                if not doctors.get(doctor_id):
                    raise ValueError("Doctor not found")

            record = MedicalRecordModel(**payload)
            session.add(record)
            session.flush()
            return self._to_schema(record)

    def update(self, record_id: int, data: MedicalRecordUpdate) -> MedicalRecord | None:
        changes = data.model_dump(exclude_unset=True)

        with self._session_scope() as session:
            record = session.get(MedicalRecordModel, record_id)
            if not record:
                return None

            doctor_id = changes.get("doctor_id")
            if doctor_id is not None:
                doctors = DoctorsService(session)
                if not doctors.get(doctor_id):
                    raise ValueError("Doctor not found")

            for field, value in changes.items():
                setattr(record, field, value)

            session.flush()
            return self._to_schema(record)

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
    def _to_schema(model: MedicalRecordModel) -> MedicalRecord:
        return MedicalRecord(
            id=model.id,
            patient_id=model.patient_id,
            doctor_id=model.doctor_id,
            diagnosis=model.diagnosis,
            treatment=model.treatment,
            notes=model.notes,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )


__all__ = ["MedicalRecordsService"]
