from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.broker import DBBroker, get_dbbroker
from app.models.system_settings import SystemSettings as SystemSettingsModel
from app.schemas.system_settings import SystemSetting, SystemSettingUpdate


class SystemSettingsService:
    """Service layer for managing system-wide settings."""

    def __init__(self, session: Session | None = None, *, broker: DBBroker | None = None) -> None:
        self._session = session
        self._broker = broker

    # ------------------------------------------------------------------
    # Public API
    def get_setting(self, key: str) -> str | None:
        """Get a system setting value by key."""
        with self._session_scope() as session:
            stmt = select(SystemSettingsModel).where(SystemSettingsModel.setting_key == key)
            setting = session.scalars(stmt).first()
            return setting.setting_value if setting else None

    def get_all_settings(self) -> list[SystemSetting]:
        """Get all system settings."""
        with self._session_scope() as session:
            stmt = select(SystemSettingsModel)
            settings = session.scalars(stmt).all()
            return [self._to_schema(model) for model in settings]

    def update_setting(self, key: str, value: str) -> SystemSetting:
        """Update a system setting value."""
        with self._session_scope() as session:
            stmt = select(SystemSettingsModel).where(SystemSettingsModel.setting_key == key)
            setting = session.scalars(stmt).first()
            
            if not setting:
                # Create new setting if it doesn't exist
                setting = SystemSettingsModel(
                    setting_key=key,
                    setting_value=value,
                    description=f"System setting: {key}"
                )
                session.add(setting)
            else:
                setting.setting_value = value
            
            session.flush()
            return self._to_schema(setting)

    def get_block_duration(self) -> int:
        """Get the current appointment block duration in minutes."""
        duration_str = self.get_setting("appointment_block_duration_minutes")
        return int(duration_str) if duration_str else 60

    def update_block_duration(self, minutes: int) -> SystemSetting:
        """Update the appointment block duration."""
        return self.update_setting("appointment_block_duration_minutes", str(minutes))

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
    def _to_schema(model: SystemSettingsModel) -> SystemSetting:
        return SystemSetting(
            id=model.id,
            setting_key=model.setting_key,
            setting_value=model.setting_value,
            description=model.description,
        )


__all__ = ["SystemSettingsService"]
