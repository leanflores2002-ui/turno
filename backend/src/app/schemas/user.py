from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field


class User(BaseModel):
    id: int
    password: str
    email: EmailStr
    is_active: bool
    is_superuser: bool
    full_name: Optional[str] = None
    role: str


class Patient(User):
    date_of_birth: Optional[date] = None
    medical_record_number: Optional[str] = None
    emergency_contact: Optional[str] = None


class Doctor(User):
    specialty: Optional[str] = None
    license_number: Optional[str] = None
    years_experience: int = 0
    office_id: Optional[int] = None


class Admin(User):
    role: Literal["superadmin", "manager", "support"] = "support"
    permissions: set[str] = Field(default_factory=set)


class UserCreate(BaseModel):
    password: str
    email: EmailStr
    is_active: bool = True
    is_superuser: bool = False
    full_name: Optional[str] = None


class PatientCreate(UserCreate):
    date_of_birth: Optional[date] = None
    medical_record_number: Optional[str] = None
    emergency_contact: Optional[str] = None


class DoctorCreate(UserCreate):
    specialty: Optional[str] = None
    license_number: Optional[str] = None
    years_experience: int = 0
    office_id: Optional[int] = None


class AdminCreate(UserCreate):
    role: Literal["superadmin", "manager", "support"] = "support"
    permissions: set[str] = Field(default_factory=set)


class UserUpdate(BaseModel):
    password: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    full_name: Optional[str] = None


class PatientUpdate(UserUpdate):
    date_of_birth: Optional[date] = None
    medical_record_number: Optional[str] = None
    emergency_contact: Optional[str] = None


class DoctorUpdate(UserUpdate):
    specialty: Optional[str] = None
    license_number: Optional[str] = None
    years_experience: Optional[int] = None
    office_id: Optional[int] = None


class AdminUpdate(UserUpdate):
    role: Optional[Literal["superadmin", "manager", "support"]] = None
    permissions: Optional[set[str]] = None

