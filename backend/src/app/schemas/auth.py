from typing import Literal

from pydantic import BaseModel, EmailStr

from app.schemas.user import Admin, Doctor, User


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponseBase(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"


class UserLoginResponse(LoginResponseBase):
    user: User


class DoctorLoginResponse(LoginResponseBase):
    user: Doctor


class AdminLoginResponse(LoginResponseBase):
    user: Admin
