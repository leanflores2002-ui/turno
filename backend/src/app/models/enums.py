from __future__ import annotations

from enum import Enum


class UserRole(str, Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"
    ADMIN = "admin"
    STAFF = "staff"


class AppointmentStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELED = "canceled"
    COMPLETED = "completed"


__all__ = ["UserRole", "AppointmentStatus"]
