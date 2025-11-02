from __future__ import annotations

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import UserRole

if TYPE_CHECKING:  # pragma: no cover
    from app.models.patient import Patient
    from app.models.doctor import Doctor
    from app.models.admin import Admin


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    full_name: Mapped[str | None] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, values_callable=lambda enum: [member.value for member in enum]),
        nullable=False,
        default=UserRole.STAFF,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    patient_profile: Mapped[Optional["Patient"]] = relationship(
        back_populates="user", uselist=False
    )
    doctor_profile: Mapped[Optional["Doctor"]] = relationship(
        back_populates="user", uselist=False
    )
    admin_profile: Mapped[Optional["Admin"]] = relationship(
        back_populates="user", uselist=False
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging helper
        return f"User(id={self.id!r}, email={self.email!r}, role={self.role!r})"


__all__ = ["User"]
