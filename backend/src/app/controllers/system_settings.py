from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.broker import get_dbbroker
from app.schemas.system_settings import SystemSetting, SystemSettingUpdate
from app.services.system_settings import SystemSettingsService


def get_system_settings_service(
    session: Annotated[Session, Depends(get_dbbroker().dependency())]
) -> SystemSettingsService:
    """Dependency to get system settings service."""
    return SystemSettingsService(session)


def get_settings(service: Annotated[SystemSettingsService, Depends(get_system_settings_service)]) -> list[SystemSetting]:
    """Get all system settings."""
    return service.get_all_settings()


def get_block_duration(service: Annotated[SystemSettingsService, Depends(get_system_settings_service)]) -> dict[str, int]:
    """Get the current appointment block duration."""
    duration = service.get_block_duration()
    return {"block_duration_minutes": duration}


def update_block_duration(
    data: SystemSettingUpdate,
    service: Annotated[SystemSettingsService, Depends(get_system_settings_service)]
) -> SystemSetting:
    """Update the appointment block duration setting."""
    try:
        duration = int(data.setting_value)
        if duration <= 0:
            raise ValueError("Block duration must be positive")
        return service.update_block_duration(duration)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        ) from e


__all__ = ["get_settings", "get_block_duration", "update_block_duration"]
