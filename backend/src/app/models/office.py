from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:  # pragma: no cover
    from app.models.admin import Admin
    from app.models.appointment import Appointment


class Office(Base):
    __tablename__ = "offices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str | None] = mapped_column(String(120))
    address: Mapped[str | None] = mapped_column(String(255))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    administrators: Mapped[list["Admin"]] = relationship(back_populates="office")
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="office")

    def __repr__(self) -> str:  # pragma: no cover
        return f"Office(id={self.id!r}, code={self.code!r})"


__all__ = ["Office"]
