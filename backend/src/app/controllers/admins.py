from app.db.broker import get_dbbroker
from app.schemas.auth import AdminLoginResponse, LoginRequest
from app.schemas.user import Admin, AdminCreate, AdminUpdate
from app.services.admins import AdminsService


def list_admins() -> list[Admin]:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = AdminsService(session)
        return svc.list()


def get_admin(admin_id: int) -> Admin | None:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = AdminsService(session)
        return svc.get(admin_id)


def create_admin(data: AdminCreate) -> Admin:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = AdminsService(session)
        return svc.create(data)


def update_admin(admin_id: int, data: AdminUpdate) -> Admin | None:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = AdminsService(session)
        return svc.update(admin_id, data)


def delete_admin(admin_id: int) -> bool:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = AdminsService(session)
        return svc.delete(admin_id)


def login_admin(data: LoginRequest) -> AdminLoginResponse | None:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = AdminsService(session)
        result = svc.authenticate(data.email, data.password)
        if not result:
            return None

        admin, token = result
        return AdminLoginResponse(access_token=token, user=admin)
