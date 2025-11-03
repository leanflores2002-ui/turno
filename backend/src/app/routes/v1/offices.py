from fastapi import APIRouter, HTTPException

from app.controllers.offices import (
    create_office,
    delete_office,
    get_office,
    list_offices,
    update_office,
)
from app.schemas.office import Office, OfficeCreate, OfficeUpdate


router = APIRouter()


@router.get("/", response_model=list[Office])
def route_list_offices():
    return list_offices()


@router.get("/{office_id}", response_model=Office)
def route_get_office(office_id: int):
    data = get_office(office_id)
    if not data:
        raise HTTPException(status_code=404, detail="Office not found")
    return data


@router.post("/", response_model=Office, status_code=201)
def route_create_office(data: OfficeCreate):
    return create_office(data)


@router.put("/{office_id}", response_model=Office)
def route_update_office(office_id: int, data: OfficeUpdate):
    item = update_office(office_id, data)
    if not item:
        raise HTTPException(status_code=404, detail="Office not found")
    return item


@router.delete("/{office_id}", status_code=204)
def route_delete_office(office_id: int):
    ok = delete_office(office_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Office not found")
