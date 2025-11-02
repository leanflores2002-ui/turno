from fastapi import APIRouter, HTTPException

from app.controllers.users import (
    create_user,
    delete_user,
    get_user,
    login_user,
    list_users,
    update_user,
)
from app.schemas.auth import LoginRequest, UserLoginResponse
from app.schemas.user import User, UserCreate, UserUpdate


router = APIRouter()


@router.get("/", response_model=list[User])
def route_list_users():
    return list_users()


@router.get("/{user_id}", response_model=User)
def route_get_user(user_id: int):
    user = get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/login", response_model=UserLoginResponse)
def route_login_user(data: LoginRequest):
    response = login_user(data)
    if not response:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return response


@router.post("/", response_model=User, status_code=201)
def route_create_user(data: UserCreate):
    return create_user(data)


@router.put("/{user_id}", response_model=User)
def route_update_user(user_id: int, data: UserUpdate):
    user = update_user(user_id, data)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.delete("/{user_id}", status_code=204)
def route_delete_user(user_id: int):
    ok = delete_user(user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="User not found")
