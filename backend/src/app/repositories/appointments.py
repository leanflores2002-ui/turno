from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from typing import Dict, Iterable, List, Optional, Protocol, runtime_checkable

from app.schemas.appointment import (
    Appointment,
    AppointmentCreate,
    AppointmentStatus,
    Availability,
    AvailabilityCreate,
    AvailabilityUpdate,
)


@runtime_checkable
class AppointmentRepository(Protocol):
    def next_identity(self) -> int: ...

    def add(self, appointment: Appointment) -> Appointment: ...

    def get(self, appointment_id: int) -> Optional[Appointment]: ...

    def list_by_patient(self, patient_id: int) -> List[Appointment]: ...

    def list_by_doctor(self, doctor_id: int) -> List[Appointment]: ...

    def save(self, appointment: Appointment) -> Appointment: ...


@runtime_checkable
class AvailabilityRepository(Protocol):
    def next_identity(self) -> int: ...

    def add(self, availability: Availability) -> Availability: ...

    def get(self, availability_id: int) -> Optional[Availability]: ...

    def list_by_doctor(self, doctor_id: int) -> List[Availability]: ...

    def save(self, availability: Availability) -> Availability: ...


class InMemoryAppointmentRepository(AppointmentRepository):
    def __init__(self) -> None:
        self._items: Dict[int, Appointment] = {}
        self._sequence: int = 0

    def next_identity(self) -> int:
        self._sequence += 1
        return self._sequence

    def add(self, appointment: Appointment) -> Appointment:
        self._items[appointment.id] = appointment
        return appointment

    def get(self, appointment_id: int) -> Optional[Appointment]:
        item = self._items.get(appointment_id)
        return item.model_copy() if item else None

    def list_by_patient(self, patient_id: int) -> List[Appointment]:
        return [item.model_copy() for item in self._items.values() if item.patient_id == patient_id]

    def list_by_doctor(self, doctor_id: int) -> List[Appointment]:
        return [item.model_copy() for item in self._items.values() if item.doctor_id == doctor_id]

    def save(self, appointment: Appointment) -> Appointment:
        self._items[appointment.id] = appointment
        return appointment

    def iter(self) -> Iterable[Appointment]:
        return (item.model_copy() for item in self._items.values())


class InMemoryAvailabilityRepository(AvailabilityRepository):
    def __init__(self) -> None:
        self._items: Dict[int, Availability] = {}
        self._sequence: int = 0
        self._by_doctor: Dict[int, List[int]] = defaultdict(list)

    def next_identity(self) -> int:
        self._sequence += 1
        return self._sequence

    def add(self, availability: Availability) -> Availability:
        self._items[availability.id] = availability
        self._by_doctor[availability.doctor_id].append(availability.id)
        return availability

    def get(self, availability_id: int) -> Optional[Availability]:
        item = self._items.get(availability_id)
        return item.model_copy() if item else None

    def list_by_doctor(self, doctor_id: int) -> List[Availability]:
        ids = self._by_doctor.get(doctor_id, [])
        return [self._items[item_id].model_copy() for item_id in ids]

    def save(self, availability: Availability) -> Availability:
        self._items[availability.id] = availability
        if availability.id not in self._by_doctor[availability.doctor_id]:
            self._by_doctor[availability.doctor_id].append(availability.id)
        return availability


def build_appointment_from_create(
    repo: AppointmentRepository, data: AppointmentCreate
) -> Appointment:
    appointment_id = repo.next_identity()
    return Appointment(id=appointment_id, **data.model_dump())


def build_availability_from_create(
    repo: AvailabilityRepository, data: AvailabilityCreate
) -> Availability:
    availability_id = repo.next_identity()
    return Availability(id=availability_id, **data.model_dump())


def overlaps(start: datetime, end: datetime, *, other_start: datetime, other_end: datetime) -> bool:
    return start < other_end and other_start < end


def ensure_doctor_is_free(appointments: Iterable[Appointment], *, start: datetime, end: datetime) -> bool:
    for appointment in appointments:
        if appointment.status != AppointmentStatus.CANCELED and overlaps(
            start, end, other_start=appointment.start_at, other_end=appointment.end_at
        ):
            return False
    return True
