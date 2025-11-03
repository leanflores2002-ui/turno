from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:  # pragma: no cover
    from app.models.availability import Availability
    from app.models.appointment import Appointment


class AppointmentBlock(Base):
    __tablename__ = "appointment_blocks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    availability_id: Mapped[int] = mapped_column(ForeignKey("doctor_availability.id", ondelete="CASCADE"), nullable=False)
    block_number: Mapped[int] = mapped_column(Integer, nullable=False)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_booked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    availability: Mapped["Availability"] = relationship(back_populates="blocks")
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="block")

    def __repr__(self) -> str:  # pragma: no cover
        return f"AppointmentBlock(id={self.id!r}, availability_id={self.availability_id!r}, block_number={self.block_number!r})"


__all__ = ["AppointmentBlock"]
