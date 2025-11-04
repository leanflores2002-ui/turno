from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.appointment import Appointment as AppointmentModel
from app.models.availability import Availability as AvailabilityModel
from app.models.enums import AppointmentStatus
from app.schemas.appointment import (
    Appointment,
    AppointmentCreate,
    Availability,
    AvailabilityCreate,
    AvailabilityUpdate,
)
from app.services.doctors import DoctorsService
from app.services.patients import PatientsService


class AppointmentError(Exception):
    """Base class for appointment-related errors."""


class NotFoundError(AppointmentError):
    """Raised when an appointment resource cannot be found."""


class ValidationError(AppointmentError):
    """Raised when domain validation fails."""


class AppointmentsService:
    """Application service that orchestrates appointments workflow using the database."""

    def __init__(self, session: Session) -> None:
        self._session = session
        self._patients = PatientsService(session)
        self._doctors = DoctorsService(session)

    # --------- Query methods ---------
    def list_for_patient(self, patient_id: int) -> list[Appointment]:
        self._ensure_patient_exists(patient_id)
        stmt = (
            select(AppointmentModel)
            .where(AppointmentModel.patient_id == patient_id)
            .order_by(AppointmentModel.start_at)
        )
        appointments = self._session.scalars(stmt).all()
        return [self._to_schema(model) for model in appointments]

    def list_for_doctor(self, doctor_id: int) -> list[Appointment]:
        self._ensure_doctor_exists(doctor_id)
        stmt = (
            select(AppointmentModel)
            .where(AppointmentModel.doctor_id == doctor_id)
            .order_by(AppointmentModel.start_at)
        )
        appointments = self._session.scalars(stmt).all()
        return [self._to_schema(model) for model in appointments]

    def list_availability(self, doctor_id: int) -> list[Availability]:
        self._ensure_doctor_exists(doctor_id)
        stmt = (
            select(AvailabilityModel)
            .where(AvailabilityModel.doctor_id == doctor_id)
            .order_by(AvailabilityModel.start_at)
        )
        availability = self._session.scalars(stmt).all()
        return [self._availability_to_schema(item) for item in availability]

    # --------- Command methods ---------
    def book(self, data: AppointmentCreate) -> Appointment:
        self._ensure_patient_exists(data.patient_id)
        self._ensure_doctor_exists(data.doctor_id)
        self._ensure_slot_available(data.doctor_id, data.start_at, data.end_at)

        availability = self._session.scalars(
            select(AvailabilityModel)
            .where(AvailabilityModel.doctor_id == data.doctor_id)
            .where(AvailabilityModel.start_at <= data.start_at)
            .where(AvailabilityModel.end_at >= data.end_at)
        ).first()

        appointment = AppointmentModel(
            doctor_id=data.doctor_id,
            patient_id=data.patient_id,
            availability_id=availability.id if availability else None,
            start_at=data.start_at,
            end_at=data.end_at,
            notes=data.notes,
            status=AppointmentStatus.PENDING,
        )
        self._session.add(appointment)
        self._session.flush()
        return self._to_schema(appointment)

    def cancel(self, appointment_id: int) -> Appointment:
        appointment = self._get_appointment_or_raise(appointment_id)
        if appointment.status == AppointmentStatus.CANCELED:
            return self._to_schema(appointment)
        appointment.status = AppointmentStatus.CANCELED
        self._session.flush()
        return self._to_schema(appointment)

    def confirm(self, appointment_id: int) -> Appointment:
        appointment = self._get_appointment_or_raise(appointment_id)
        if appointment.status == AppointmentStatus.CANCELED:
            raise ValidationError("Cannot confirm a canceled appointment")
        appointment.status = AppointmentStatus.CONFIRMED
        self._session.flush()
        return self._to_schema(appointment)

    def complete(self, appointment_id: int) -> Appointment:
        appointment = self._get_appointment_or_raise(appointment_id)
        if appointment.status != AppointmentStatus.CONFIRMED:
            raise ValidationError("Only confirmed appointments can be completed")
        appointment.status = AppointmentStatus.COMPLETED
        self._session.flush()
        return self._to_schema(appointment)

    def create_availability(self, data: AvailabilityCreate) -> Availability:
        self._ensure_doctor_exists(data.doctor_id)
        self._deny_overlapping_availability(
            doctor_id=data.doctor_id,
            start=data.start_at,
            end=data.end_at,
        )
        availability = AvailabilityModel(
            doctor_id=data.doctor_id,
            start_at=data.start_at,
            end_at=data.end_at,
            slots=data.slots,
        )
        self._session.add(availability)
        self._session.flush()
        return self._availability_to_schema(availability)

    def update_availability(self, availability_id: int, data: AvailabilityUpdate) -> Availability:
        availability = self._session.get(AvailabilityModel, availability_id)
        if not availability:
            raise NotFoundError("Availability not found")

        payload = data.model_dump(exclude_unset=True)
        new_start = payload.get("start_at", availability.start_at)
        new_end = payload.get("end_at", availability.end_at)
        self._deny_overlapping_availability(
            doctor_id=availability.doctor_id,
            start=new_start,
            end=new_end,
            skip_id=availability_id,
        )

        for field, value in payload.items():
            setattr(availability, field, value)

        self._session.flush()
        return self._availability_to_schema(availability)

    # --------- Internal helpers ---------
    def _ensure_patient_exists(self, patient_id: int) -> None:
        if not self._patients.get(patient_id):
            raise ValidationError("Patient not found")

    def _ensure_doctor_exists(self, doctor_id: int) -> None:
        if not self._doctors.get(doctor_id):
            raise ValidationError("Doctor not found")

    def _get_appointment_or_raise(self, appointment_id: int) -> AppointmentModel:
        appointment = self._session.get(AppointmentModel, appointment_id)
        if not appointment:
            raise NotFoundError("Appointment not found")
        return appointment

    def _ensure_slot_available(self, doctor_id: int, start: datetime, end: datetime) -> None:
        stmt = (
            select(AppointmentModel)
            .where(AppointmentModel.doctor_id == doctor_id)
            .where(AppointmentModel.status != AppointmentStatus.CANCELED)
            .where(AppointmentModel.start_at < end)
            .where(start < AppointmentModel.end_at)
        )
        conflict = self._session.scalars(stmt).first()
        if conflict:
            raise ValidationError("Doctor already has an appointment in this slot")

        availability = self._session.scalars(
            select(AvailabilityModel)
            .where(AvailabilityModel.doctor_id == doctor_id)
            .where(AvailabilityModel.start_at <= start)
            .where(AvailabilityModel.end_at >= end)
        ).first()
        if not availability:
            raise ValidationError("Doctor is not available in this time range")

    def _deny_overlapping_availability(
        self,
        *,
        doctor_id: int,
        start: datetime,
        end: datetime,
        skip_id: Optional[int] = None,
    ) -> None:
        stmt = (
            select(AvailabilityModel)
            .where(AvailabilityModel.doctor_id == doctor_id)
            .where(AvailabilityModel.start_at < end)
            .where(start < AvailabilityModel.end_at)
        )
        if skip_id is not None:
            stmt = stmt.where(AvailabilityModel.id != skip_id)
        conflict = self._session.scalars(stmt).first()
        if conflict:
            raise ValidationError("Overlapping availability slot")

    @staticmethod
    def _to_schema(model: AppointmentModel) -> Appointment:
        return Appointment(
            id=model.id,
            doctor_id=model.doctor_id,
            patient_id=model.patient_id,
            start_at=model.start_at,
            end_at=model.end_at,
            notes=model.notes,
            status=model.status,
        )

    @staticmethod
    def _availability_to_schema(model: AvailabilityModel) -> Availability:
        return Availability(
            id=model.id,
            doctor_id=model.doctor_id,
            start_at=model.start_at,
            end_at=model.end_at,
            slots=model.slots,
        )
