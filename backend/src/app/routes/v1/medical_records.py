from fastapi import APIRouter, HTTPException

from app.controllers.medical_records import (
    create_medical_record,
    get_medical_record,
    get_patient_medical_history,
    list_doctor_records,
    list_patient_records,
    update_medical_record,
)
from app.schemas.medical_record import (
    MedicalRecord,
    MedicalRecordCreate,
    MedicalRecordUpdate,
)


router = APIRouter()


@router.get("/patients/{patient_id}", response_model=list[MedicalRecord])
def route_list_patient_records(patient_id: int):
    return list_patient_records(patient_id)


@router.get("/doctors/{doctor_id}", response_model=list[MedicalRecord])
def route_list_doctor_records(doctor_id: int):
    return list_doctor_records(doctor_id)


@router.get("/patients/{patient_id}/history", response_model=list[MedicalRecord])
def route_get_patient_medical_history(patient_id: int):
    return get_patient_medical_history(patient_id)


@router.get("/{record_id}", response_model=MedicalRecord)
def route_get_medical_record(record_id: int):
    try:
        return get_medical_record(record_id)
    except HTTPException:
        raise


@router.post("/", response_model=MedicalRecord, status_code=201)
def route_create_medical_record(data: MedicalRecordCreate):
    return create_medical_record(data)


@router.patch("/{record_id}", response_model=MedicalRecord)
def route_update_medical_record(record_id: int, data: MedicalRecordUpdate):
    return update_medical_record(record_id, data)
