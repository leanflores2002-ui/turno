from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, PositiveInt, field_validator


class MedicalRecordBase(BaseModel):
    patient_id: PositiveInt
    doctor_id: Optional[PositiveInt] = None
    diagnosis: Optional[str] = None
    treatment: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("diagnosis", "treatment", "notes", mode="before")
    @classmethod
    def _strip_strings(cls, value: Optional[str]) -> Optional[str]:
        if isinstance(value, str):
            value = value.strip()
        return value or None


class MedicalRecordCreate(MedicalRecordBase):
    pass


class MedicalRecordUpdate(BaseModel):
    doctor_id: Optional[PositiveInt] = None
    diagnosis: Optional[str] = None
    treatment: Optional[str] = None
    notes: Optional[str] = None

    model_config = {"extra": "forbid"}

    @field_validator("diagnosis", "treatment", "notes", mode="before")
    @classmethod
    def _strip_strings(cls, value: Optional[str]) -> Optional[str]:
        if isinstance(value, str):
            value = value.strip()
        return value or None


class MedicalRecord(MedicalRecordBase):
    id: PositiveInt
    created_at: datetime
    updated_at: datetime
    doctor_name: Optional[str] = None


__all__ = ["MedicalRecord", "MedicalRecordCreate", "MedicalRecordUpdate"]
