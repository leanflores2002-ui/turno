from fastapi import APIRouter, HTTPException

from app.controllers.patients import (
    create_patient,
    delete_patient,
    get_patient,
    list_patients,
    update_patient,
)
from app.schemas.user import Patient, PatientCreate, PatientUpdate


router = APIRouter()


@router.get("/", response_model=list[Patient])
def route_list_patients():
    return list_patients()


@router.get("/{patient_id}", response_model=Patient)
def route_get_patient(patient_id: int):
    data = get_patient(patient_id)
    if not data:
        raise HTTPException(status_code=404, detail="Patient not found")
    return data


@router.post("/", response_model=Patient, status_code=201)
def route_create_patient(data: PatientCreate):
    return create_patient(data)


@router.put("/{patient_id}", response_model=Patient)
def route_update_patient(patient_id: int, data: PatientUpdate):
    item = update_patient(patient_id, data)
    if not item:
        raise HTTPException(status_code=404, detail="Patient not found")
    return item


@router.delete("/{patient_id}", status_code=204)
def route_delete_patient(patient_id: int):
    ok = delete_patient(patient_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Patient not found")

