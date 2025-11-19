from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:  # pragma: no cover
    from app.models.user import User
    from app.models.appointment import Appointment
    from app.models.availability import Availability
    from app.models.medical_record import MedicalRecord
    from app.models.office import Office


class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    license_number: Mapped[str | None] = mapped_column(String(100), unique=True)
    specialty: Mapped[str | None] = mapped_column(String(120))
    phone: Mapped[str | None] = mapped_column(String(50))
    years_experience: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    office_id: Mapped[int | None] = mapped_column(
        ForeignKey("offices.id", ondelete="SET NULL"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="doctor_profile")
    office: Mapped["Office | None"] = relationship(back_populates="doctors")
    appointments: Mapped[list["Appointment"]] = relationship(
        back_populates="doctor", cascade="all, delete-orphan"
    )
    availabilities: Mapped[list["Availability"]] = relationship(
        back_populates="doctor", cascade="all, delete-orphan"
    )
    medical_records: Mapped[list["MedicalRecord"]] = relationship(back_populates="doctor")

    def __repr__(self) -> str:  # pragma: no cover
        return f"Doctor(id={self.id!r}, user_id={self.user_id!r})"


__all__ = ["Doctor"]
