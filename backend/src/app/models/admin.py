from __future__ import annotations

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.mysql import JSON as MySQLJSON
from sqlalchemy.types import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

JSONType = JSON().with_variant(MySQLJSON, "mysql")


if TYPE_CHECKING:  # pragma: no cover
    from app.models.user import User
    from app.models.office import Office


class Admin(Base):
    __tablename__ = "admins"

    id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    office_id: Mapped[int | None] = mapped_column(
        ForeignKey("offices.id", ondelete="SET NULL"), nullable=True
    )
    role: Mapped[str | None] = mapped_column(String(50))
    permissions: Mapped[list[str]] = mapped_column(JSONType, nullable=False, default=list)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="admin_profile")
    office: Mapped[Optional["Office"]] = relationship(back_populates="administrators")

    def __repr__(self) -> str:  # pragma: no cover
        return f"Admin(id={self.id!r}, office_id={self.office_id!r})"


__all__ = ["Admin"]
