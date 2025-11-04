from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, PositiveInt

from app.models.enums import AppointmentStatus


class AppointmentBase(BaseModel):
    doctor_id: PositiveInt
    patient_id: PositiveInt
    start_at: datetime = Field(serialization_alias="startAt")
    end_at: datetime = Field(serialization_alias="endAt")
    notes: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "doctor_id": 1,
                "patient_id": 1,
                "start_at": "2024-10-01T10:00:00",
                "end_at": "2024-10-01T10:30:00",
                "notes": "Consulta de control",
            }
        }
    }


class AppointmentCreate(AppointmentBase):
    pass


class Appointment(AppointmentBase):
    id: PositiveInt
    status: AppointmentStatus = AppointmentStatus.PENDING


class AppointmentUpdateStatus(BaseModel):
    status: AppointmentStatus


class Availability(BaseModel):
    id: PositiveInt
    doctor_id: PositiveInt
    start_at: datetime = Field(serialization_alias="startAt")
    end_at: datetime = Field(serialization_alias="endAt")
    slots: PositiveInt = 1


class AvailabilityCreate(BaseModel):
    doctor_id: PositiveInt
    start_at: datetime = Field(serialization_alias="startAt")
    end_at: datetime = Field(serialization_alias="endAt")
    slots: PositiveInt = Field(default=1, le=4)


class AvailabilityUpdate(BaseModel):
    start_at: Optional[datetime] = Field(None, serialization_alias="startAt")
    end_at: Optional[datetime] = Field(None, serialization_alias="endAt")
    slots: Optional[PositiveInt] = Field(None, le=4)
