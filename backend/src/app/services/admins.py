from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.db.broker import DBBroker, get_dbbroker
from app.models.admin import Admin as AdminModel
from app.models.enums import UserRole
from app.models.user import User as UserModel
from app.schemas.user import Admin, AdminCreate, AdminUpdate
from app.utils.security import hash_password, verify_password


class AdminsService:
    """Service layer backed by the relational database for administrators."""

    def __init__(self, session: Session | None = None, *, broker: DBBroker | None = None) -> None:
        self._session = session
        self._broker = broker

    # ------------------------------------------------------------------
    def list(self) -> list[Admin]:
        with self._session_scope() as session:
            stmt = select(AdminModel).options(joinedload(AdminModel.user))
            admins = session.scalars(stmt).all()
            return [self._to_schema(model) for model in admins if model.user]

    def get(self, admin_id: int) -> Admin | None:
        with self._session_scope() as session:
            model = session.get(AdminModel, admin_id)
            if not model or not model.user:
                return None
            return self._to_schema(model)

    def create(self, data: AdminCreate) -> Admin:
        payload = data.model_dump()
        password = payload.pop("password")
        permissions = payload.pop("permissions", set())

        user = UserModel(
            email=payload.pop("email"),
            password_hash=hash_password(password),
            is_active=payload.pop("is_active", True),
            is_superuser=payload.pop("is_superuser", False),
            full_name=payload.pop("full_name", None),
            role=UserRole.ADMIN,
        )
        admin = AdminModel(**payload, permissions=sorted(permissions))
        user.admin_profile = admin

        with self._session_scope() as session:
            session.add(user)
            try:
                session.flush()
            except IntegrityError as exc:  # pragma: no cover - relies on DB constraint
                session.rollback()
                raise ValueError("Admin could not be created (duplicate data)") from exc
            return self._to_schema(admin)

    def update(self, admin_id: int, data: AdminUpdate) -> Admin | None:
        changes = data.model_dump(exclude_unset=True)
        with self._session_scope() as session:
            admin = session.get(AdminModel, admin_id)
            if not admin or not admin.user:
                return None

            user = admin.user

            password = changes.pop("password", None)
            if password:
                user.password_hash = hash_password(password)

            permissions = changes.pop("permissions", None)

            for field in ("email", "is_active", "is_superuser", "full_name"):
                if field in changes and hasattr(user, field):
                    setattr(user, field, changes.pop(field))

            for field, value in changes.items():
                if hasattr(admin, field):
                    setattr(admin, field, value)

            if permissions is not None:
                admin.permissions = sorted(permissions)

            session.flush()
            return self._to_schema(admin)

    def delete(self, admin_id: int) -> bool:
        with self._session_scope() as session:
            admin = session.get(AdminModel, admin_id)
            if not admin:
                return False

            user = admin.user
            session.delete(admin)
            if user:
                session.delete(user)
            session.flush()
            return True

    def authenticate(self, email: str, password: str) -> tuple[Admin, str] | None:
        with self._session_scope() as session:
            stmt = (
                select(AdminModel)
                .join(AdminModel.user)
                .options(joinedload(AdminModel.user))
                .where(UserModel.email == email)
            )
            admin = session.scalars(stmt).first()
            if not admin or not admin.user or not admin.user.is_active:
                return None

            if not verify_password(password, admin.user.password_hash):
                return None

            return self._to_schema(admin), f"admin-token-{admin.user.id}"

    # ------------------------------------------------------------------
    @contextmanager
    def _session_scope(self) -> Iterator[Session]:
        if self._session is not None:
            yield self._session
        else:
            broker = self._broker or get_dbbroker()
            with broker.session() as session:
                yield session

    @staticmethod
    def _to_schema(model: AdminModel) -> Admin:
        user = model.user
        if not user:
            raise ValueError("Admin is missing related user data")
        return Admin(
            id=user.id,
            email=user.email,
            password="***",
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            full_name=user.full_name,
            role=model.role or "support",  # Admin-specific role
            permissions=set(model.permissions or []),
        )
