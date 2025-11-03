from typing import Optional

from pydantic import BaseModel, Field


class Office(BaseModel):
    id: int
    code: str
    name: Optional[str] = None
    address: Optional[str] = None


class OfficeCreate(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    name: Optional[str] = Field(None, max_length=120)
    address: Optional[str] = Field(None, max_length=255)


class OfficeUpdate(BaseModel):
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    name: Optional[str] = Field(None, max_length=120)
    address: Optional[str] = Field(None, max_length=255)
