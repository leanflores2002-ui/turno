from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, SmallInteger, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:  # pragma: no cover
    from app.models.doctor import Doctor
    from app.models.appointment import Appointment


class Availability(Base):
    __tablename__ = "doctor_availability"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    slots: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=1)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    doctor: Mapped["Doctor"] = relationship(back_populates="availabilities")
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="availability")

    def __repr__(self) -> str:  # pragma: no cover
        return f"Availability(id={self.id!r}, doctor_id={self.doctor_id!r})"


__all__ = ["Availability"]
