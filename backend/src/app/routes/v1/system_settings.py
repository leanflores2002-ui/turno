from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.controllers.system_settings import (
    get_block_duration,
    get_settings,
    update_block_duration,
)
from app.db.broker import get_dbbroker
from app.schemas.system_settings import SystemSetting, SystemSettingUpdate

router = APIRouter()


@router.get("/", response_model=list[SystemSetting])
def list_settings(
    settings: Annotated[list[SystemSetting], Depends(get_settings)]
) -> list[SystemSetting]:
    """Get all system settings."""
    return settings


@router.get("/block-duration", response_model=dict[str, int])
def get_block_duration_setting(
    duration: Annotated[dict[str, int], Depends(get_block_duration)]
) -> dict[str, int]:
    """Get the current appointment block duration in minutes."""
    return duration


@router.put("/block-duration", response_model=SystemSetting, status_code=status.HTTP_200_OK)
def update_block_duration_setting(
    data: SystemSettingUpdate,
    updated_setting: Annotated[SystemSetting, Depends(update_block_duration)]
) -> SystemSetting:
    """Update the appointment block duration setting (admin only)."""
    return updated_setting


__all__ = ["router"]
