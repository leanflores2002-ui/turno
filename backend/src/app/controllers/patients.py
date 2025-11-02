from app.db.broker import get_dbbroker
from app.schemas.user import Patient, PatientCreate, PatientUpdate
from app.services.patients import PatientsService


def list_patients() -> list[Patient]:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = PatientsService(session)
        return svc.list()


def get_patient(patient_id: int) -> Patient | None:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = PatientsService(session)
        return svc.get(patient_id)


def create_patient(data: PatientCreate) -> Patient:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = PatientsService(session)
        return svc.create(data)


def update_patient(patient_id: int, data: PatientUpdate) -> Patient | None:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = PatientsService(session)
        return svc.update(patient_id, data)


def delete_patient(patient_id: int) -> bool:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = PatientsService(session)
        return svc.delete(patient_id)
