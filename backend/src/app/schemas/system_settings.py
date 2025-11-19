from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field, PositiveInt


class SystemSetting(BaseModel):
    id: PositiveInt
    setting_key: str
    setting_value: str
    description: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": 1,
                "setting_key": "appointment_block_duration_minutes",
                "setting_value": "60",
                "description": "Duration of each appointment block in minutes",
            }
        }
    }


class SystemSettingUpdate(BaseModel):
    setting_value: str = Field(..., description="New value for the setting")

    model_config = {
        "json_schema_extra": {
            "example": {
                "setting_value": "90",
            }
        }
    }


class AppointmentBlockConfig(BaseModel):
    block_duration_minutes: PositiveInt = Field(
        default=60, 
        description="Duration of each appointment block in minutes"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "block_duration_minutes": 60,
            }
        }
    }


__all__ = ["SystemSetting", "SystemSettingUpdate", "AppointmentBlockConfig"]
