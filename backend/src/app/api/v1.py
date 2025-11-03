from fastapi import APIRouter

from app.routes.v1.users import router as users_router
from app.routes.v1.patients import router as patients_router
from app.routes.v1.doctors import router as doctors_router
from app.routes.v1.admins import router as admins_router
from app.routes.v1.appointments import router as appointments_router
from app.routes.v1.medical_records import router as medical_records_router
from app.routes.v1.system_settings import router as system_settings_router
from app.routes.v1.offices import router as offices_router


api_v1_router = APIRouter()
api_v1_router.include_router(users_router, prefix="/users", tags=["users"])
api_v1_router.include_router(patients_router, prefix="/patients", tags=["patients"])
api_v1_router.include_router(doctors_router, prefix="/doctors", tags=["doctors"])
api_v1_router.include_router(admins_router, prefix="/admins", tags=["admins"])
api_v1_router.include_router(appointments_router, prefix="/appointments", tags=["appointments"])
api_v1_router.include_router(
    medical_records_router,
    prefix="/medical-records",
    tags=["medical-records"],
)
api_v1_router.include_router(system_settings_router, prefix="/settings", tags=["system-settings"])
api_v1_router.include_router(offices_router, prefix="/offices", tags=["offices"])
