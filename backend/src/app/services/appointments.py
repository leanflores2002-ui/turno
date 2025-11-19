from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.appointment import Appointment as AppointmentModel
from app.models.appointment_block import AppointmentBlock as AppointmentBlockModel
from app.models.availability import Availability as AvailabilityModel
from app.models.enums import AppointmentStatus
from app.schemas.appointment import (
    Appointment,
    AppointmentBlock,
    AppointmentCreate,
    Availability,
    AvailabilityCreate,
    AvailabilityUpdate,
)
from app.services.doctors import DoctorsService
from app.services.patients import PatientsService
from app.services.system_settings import SystemSettingsService


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
        self._settings = SystemSettingsService(session)

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

    def list_available_blocks(self, doctor_id: int, start_date: datetime, end_date: datetime) -> list[AppointmentBlock]:
        """Get available blocks for a doctor within a date range."""
        self._ensure_doctor_exists(doctor_id)
        stmt = (
            select(AppointmentBlockModel)
            .join(AvailabilityModel, AppointmentBlockModel.availability_id == AvailabilityModel.id)
            .where(AvailabilityModel.doctor_id == doctor_id)
            .where(AppointmentBlockModel.start_at >= start_date)
            .where(AppointmentBlockModel.end_at <= end_date)
            .where(AppointmentBlockModel.is_booked == False)
            .order_by(AppointmentBlockModel.start_at)
        )
        blocks = self._session.scalars(stmt).all()
        return [self._block_to_schema(block) for block in blocks]

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
        
        # Validate that times align with block boundaries
        block_duration = self._settings.get_block_duration()
        self._validate_block_alignment(data.start_at, data.end_at, block_duration)
        
        availability = AvailabilityModel(
            doctor_id=data.doctor_id,
            start_at=data.start_at,
            end_at=data.end_at,
        )
        self._session.add(availability)
        self._session.flush()
        
        # Create blocks for this availability
        self._create_blocks_for_availability(availability, block_duration)
        
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
        blocks = [AppointmentsService._block_to_schema(block) for block in model.blocks]
        return Availability(
            id=model.id,
            doctor_id=model.doctor_id,
            start_at=model.start_at,
            end_at=model.end_at,
            blocks=blocks,
        )

    @staticmethod
    def _block_to_schema(model: AppointmentBlockModel) -> AppointmentBlock:
        return AppointmentBlock(
            id=model.id,
            availability_id=model.availability_id,
            block_number=model.block_number,
            start_at=model.start_at,
            end_at=model.end_at,
            is_booked=model.is_booked,
        )

    def _validate_block_alignment(self, start: datetime, end: datetime, block_duration: int) -> None:
        """Validate that start and end times align with block boundaries."""
        from datetime import timedelta
        
        # Check if start time aligns with block boundaries (e.g., on the hour)
        if start.minute != 0 or start.second != 0:
            raise ValidationError("Start time must align with block boundaries (e.g., 9:00, 10:00)")
        
        # Check if duration is a multiple of block duration
        duration_minutes = int((end - start).total_seconds() / 60)
        if duration_minutes % block_duration != 0:
            raise ValidationError(f"Duration must be a multiple of {block_duration} minutes")

    def _create_blocks_for_availability(self, availability: AvailabilityModel, block_duration: int) -> None:
        """Create appointment blocks for an availability period."""
        from datetime import timedelta
        
        current_time = availability.start_at
        block_number = 1
        
        while current_time < availability.end_at:
            block_end = current_time + timedelta(minutes=block_duration)
            
            block = AppointmentBlockModel(
                availability_id=availability.id,
                block_number=block_number,
                start_at=current_time,
                end_at=block_end,
                is_booked=False,
            )
            self._session.add(block)
            
            current_time = block_end
            block_number += 1
        
        self._session.flush()
