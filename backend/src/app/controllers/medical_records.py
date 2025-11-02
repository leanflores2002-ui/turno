from fastapi import HTTPException

from app.db.broker import get_dbbroker
from app.schemas.medical_record import (
    MedicalRecord,
    MedicalRecordCreate,
    MedicalRecordUpdate,
)
from app.services.medical_records import MedicalRecordsService


def list_patient_records(patient_id: int) -> list[MedicalRecord]:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = MedicalRecordsService(session)
        return svc.list_for_patient(patient_id)


def list_doctor_records(doctor_id: int) -> list[MedicalRecord]:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = MedicalRecordsService(session)
        return svc.list_for_doctor(doctor_id)


def get_medical_record(record_id: int) -> MedicalRecord:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = MedicalRecordsService(session)
        record = svc.get(record_id)
        if not record:
            raise HTTPException(status_code=404, detail="Medical record not found")
        return record


def create_medical_record(data: MedicalRecordCreate) -> MedicalRecord:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = MedicalRecordsService(session)
        try:
            return svc.create(data)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc


def update_medical_record(record_id: int, data: MedicalRecordUpdate) -> MedicalRecord:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = MedicalRecordsService(session)
        try:
            record = svc.update(record_id, data)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        if not record:
            raise HTTPException(status_code=404, detail="Medical record not found")
        return record


__all__ = [
    "list_patient_records",
    "list_doctor_records",
    "get_medical_record",
    "create_medical_record",
    "update_medical_record",
]
