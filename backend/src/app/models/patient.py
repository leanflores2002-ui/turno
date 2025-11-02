from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:  # pragma: no cover
    from app.models.user import User
    from app.models.appointment import Appointment
    from app.models.medical_record import MedicalRecord


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    date_of_birth: Mapped[date | None] = mapped_column(Date)
    medical_record_number: Mapped[str | None] = mapped_column(String(50), unique=True)
    emergency_contact: Mapped[str | None] = mapped_column(String(255))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="patient_profile")
    appointments: Mapped[list["Appointment"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    medical_records: Mapped[list["MedicalRecord"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"Patient(id={self.id!r}, user_id={self.user_id!r})"


__all__ = ["Patient"]
