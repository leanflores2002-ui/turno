from app.db.broker import get_dbbroker
from app.schemas.office import Office, OfficeCreate, OfficeUpdate
from app.services.offices import OfficesService


def list_offices() -> list[Office]:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = OfficesService(session)
        return svc.list()


def get_office(office_id: int) -> Office | None:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = OfficesService(session)
        return svc.get(office_id)


def create_office(data: OfficeCreate) -> Office:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = OfficesService(session)
        return svc.create(data)


def update_office(office_id: int, data: OfficeUpdate) -> Office | None:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = OfficesService(session)
        return svc.update(office_id, data)


def delete_office(office_id: int) -> bool:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = OfficesService(session)
        return svc.delete(office_id)
