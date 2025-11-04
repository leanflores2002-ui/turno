from fastapi import APIRouter, HTTPException

from app.controllers.doctors import (
    create_doctor,
    delete_doctor,
    get_doctor,
    login_doctor,
    list_doctors,
    update_doctor,
)
from app.schemas.auth import DoctorLoginResponse, LoginRequest
from app.schemas.user import Doctor, DoctorCreate, DoctorUpdate


router = APIRouter()


@router.get("/", response_model=list[Doctor])
def route_list_doctors():
    return list_doctors()


@router.get("/{doctor_id}", response_model=Doctor)
def route_get_doctor(doctor_id: int):
    data = get_doctor(doctor_id)
    if not data:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return data


@router.post("/login", response_model=DoctorLoginResponse)
def route_login_doctor(data: LoginRequest):
    response = login_doctor(data)
    if not response:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return response


@router.post("/", response_model=Doctor, status_code=201)
def route_create_doctor(data: DoctorCreate):
    return create_doctor(data)


@router.put("/{doctor_id}", response_model=Doctor)
def route_update_doctor(doctor_id: int, data: DoctorUpdate):
    item = update_doctor(doctor_id, data)
    if not item:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return item


@router.delete("/{doctor_id}", status_code=204)
def route_delete_doctor(doctor_id: int):
    ok = delete_doctor(doctor_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Doctor not found")
