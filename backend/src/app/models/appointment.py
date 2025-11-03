from __future__ import annotations

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import AppointmentStatus

if TYPE_CHECKING:  # pragma: no cover
    from app.models.patient import Patient
    from app.models.doctor import Doctor
    from app.models.availability import Availability
    from app.models.office import Office
    from app.models.appointment_block import AppointmentBlock


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id", ondelete="CASCADE"), nullable=False
    )
    availability_id: Mapped[int | None] = mapped_column(
        ForeignKey("doctor_availability.id", ondelete="SET NULL"), nullable=True
    )
    block_id: Mapped[int | None] = mapped_column(
        ForeignKey("appointment_blocks.id", ondelete="SET NULL"), nullable=True
    )
    office_id: Mapped[int | None] = mapped_column(
        ForeignKey("offices.id", ondelete="SET NULL"), nullable=True
    )
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    status: Mapped[AppointmentStatus] = mapped_column(
        Enum(
            AppointmentStatus,
            values_callable=lambda enum: [member.value for member in enum],
        ),
        nullable=False,
        default=AppointmentStatus.PENDING,
    )
    cancel_reason: Mapped[str | None] = mapped_column(String(255))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    doctor: Mapped["Doctor"] = relationship(back_populates="appointments")
    patient: Mapped["Patient"] = relationship(back_populates="appointments")
    availability: Mapped[Optional["Availability"]] = relationship(
        back_populates="appointments"
    )
    block: Mapped[Optional["AppointmentBlock"]] = relationship(back_populates="appointments")
    office: Mapped[Optional["Office"]] = relationship(back_populates="appointments")

    def __repr__(self) -> str:  # pragma: no cover
        return f"Appointment(id={self.id!r}, doctor_id={self.doctor_id!r}, status={self.status!r})"


__all__ = ["Appointment"]
