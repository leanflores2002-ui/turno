from __future__ import annotations

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:  # pragma: no cover
    from app.models.patient import Patient
    from app.models.doctor import Doctor


class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id", ondelete="CASCADE"), nullable=False
    )
    doctor_id: Mapped[int | None] = mapped_column(
        ForeignKey("doctors.id", ondelete="SET NULL"), nullable=True
    )
    diagnosis: Mapped[str | None] = mapped_column(Text)
    treatment: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    patient: Mapped["Patient"] = relationship(back_populates="medical_records")
    doctor: Mapped[Optional["Doctor"]] = relationship(back_populates="medical_records")

    def __repr__(self) -> str:  # pragma: no cover
        return f"MedicalRecord(id={self.id!r}, patient_id={self.patient_id!r})"


__all__ = ["MedicalRecord"]
