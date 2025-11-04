from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.enums import UserRole
from app.models.user import User as UserModel
from app.schemas.user import User, UserCreate, UserUpdate
from app.utils.security import hash_password, verify_password


class UsersService:
    """Service layer wrapping persistence logic for users."""

    def __init__(self, session: Session) -> None:
        self._session = session

    # ------------------------------------------------------------------
    # Query methods
    def list(self) -> list[User]:
        users = self._session.scalars(select(UserModel)).all()
        return [self._to_schema(user) for user in users]

    def get(self, user_id: int) -> Optional[User]:
        model = self._session.get(UserModel, user_id)
        return self._to_schema(model) if model else None

    # ------------------------------------------------------------------
    # Command methods
    def create(self, data: UserCreate, *, role: Optional[UserRole] = None) -> User:
        model = UserModel(
            email=data.email,
            password_hash=hash_password(data.password),
            is_active=data.is_active,
            is_superuser=data.is_superuser,
            full_name=data.full_name,
            role=role or (UserRole.ADMIN if data.is_superuser else UserRole.STAFF),
        )
        self._session.add(model)
        try:
            self._session.flush()
        except IntegrityError as exc:  # pragma: no cover - relies on DB constraint
            self._session.rollback()
            raise ValueError("Email already in use") from exc
        return self._to_schema(model)

    def update(self, user_id: int, data: UserUpdate) -> Optional[User]:
        model = self._session.get(UserModel, user_id)
        if not model:
            return None

        payload = data.model_dump(exclude_unset=True)
        password = payload.pop("password", None)
        if password:
            model.password_hash = hash_password(password)

        for field, value in payload.items():
            if hasattr(model, field):
                setattr(model, field, value)

        self._session.flush()
        return self._to_schema(model)

    def delete(self, user_id: int) -> bool:
        model = self._session.get(UserModel, user_id)
        if not model:
            return False
        self._session.delete(model)
        self._session.flush()
        return True

    # ------------------------------------------------------------------
    def authenticate(self, email: str, password: str) -> Optional[User]:
        model = self._session.scalar(
            select(UserModel).where(UserModel.email == email)
        )
        if not model or not model.is_active:
            return None
        if not verify_password(password, model.password_hash):
            return None
        return self._to_schema(model)

    # ------------------------------------------------------------------
    def _to_schema(self, model: UserModel) -> User:
        return User(
            id=model.id,
            email=model.email,
            password="***",
            is_active=model.is_active,
            is_superuser=model.is_superuser,
            full_name=model.full_name,
        )


__all__ = ["UsersService"]
