from fastapi import HTTPException

from app.db.broker import get_dbbroker
from app.schemas.appointment import (
    Appointment,
    AppointmentCreate,
    Availability,
    AvailabilityCreate,
    AvailabilityUpdate,
)
from app.services.appointments import AppointmentsService, NotFoundError, ValidationError


def list_patient_appointments(patient_id: int) -> list[Appointment]:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = AppointmentsService(session)
        try:
            return svc.list_for_patient(patient_id)
        except ValidationError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc


def list_doctor_appointments(doctor_id: int) -> list[Appointment]:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = AppointmentsService(session)
        try:
            return svc.list_for_doctor(doctor_id)
        except ValidationError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc


def book_appointment(data: AppointmentCreate) -> Appointment:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = AppointmentsService(session)
        try:
            return svc.book(data)
        except ValidationError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc


def cancel_appointment(appointment_id: int) -> Appointment:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = AppointmentsService(session)
        try:
            return svc.cancel(appointment_id)
        except NotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc


def confirm_appointment(appointment_id: int) -> Appointment:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = AppointmentsService(session)
        try:
            return svc.confirm(appointment_id)
        except NotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except ValidationError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc


def complete_appointment(appointment_id: int) -> Appointment:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = AppointmentsService(session)
        try:
            return svc.complete(appointment_id)
        except NotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except ValidationError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc


def list_availability(doctor_id: int) -> list[Availability]:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = AppointmentsService(session)
        try:
            return svc.list_availability(doctor_id)
        except ValidationError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc


def create_availability(data: AvailabilityCreate) -> Availability:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = AppointmentsService(session)
        try:
            return svc.create_availability(data)
        except ValidationError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc


def update_availability(availability_id: int, data: AvailabilityUpdate) -> Availability:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = AppointmentsService(session)
        try:
            return svc.update_availability(availability_id, data)
        except NotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except ValidationError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
