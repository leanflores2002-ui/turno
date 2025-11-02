#!/usr/bin/env python
"""
Utility script that exercises the core TurnoPlus use cases end-to-end.

The flows are derived from `docs/casos-de-uso.md` and currently cover:

* Patient registration, login, profile update, appointment booking, querying, and cancelation.
* Doctor login plus availability management and appointment confirmation/completion.
* Administrator login together with provisioning and removal of doctors.

The script drives the FastAPI service layer directly against the configured
database so we can validate our domain logic and data interactions end-to-end.
"""
from __future__ import annotations

import json
import sys
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional


ROOT_DIR = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT_DIR / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from app.db.broker import get_dbbroker  # noqa: E402
from app.schemas.appointment import (  # noqa: E402
    Appointment,
    AppointmentCreate,
    Availability,
    AvailabilityCreate,
    AvailabilityUpdate,
)
from app.schemas.user import (  # noqa: E402
    AdminCreate,
    Doctor,
    DoctorCreate,
    Patient,
    PatientCreate,
    PatientUpdate,
)
from app.services.admins import AdminsService  # noqa: E402
from app.services.appointments import AppointmentsService, ValidationError  # noqa: E402
from app.services.doctors import DoctorsService  # noqa: E402
from app.services.patients import PatientsService  # noqa: E402
from app.schemas.medical_record import MedicalRecordCreate, MedicalRecordUpdate  # noqa: E402
from app.services.medical_records import MedicalRecordsService  # noqa: E402


@dataclass
class FlowResult:
    case_id: str
    description: str
    payload: Any = field(default=None)
    error: Optional[str] = field(default=None)

    def as_dict(self) -> Dict[str, Any]:
        data = {
            "case_id": self.case_id,
            "description": self.description,
        }
        if self.error:
            data["error"] = self.error
        else:
            data["payload"] = serialize(self.payload)
        return data


def serialize(value: Any) -> Any:
    if hasattr(value, "model_dump"):
        return serialize(value.model_dump())
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, set):
        return [serialize(item) for item in sorted(value)]
    if isinstance(value, list):
        return [serialize(item) for item in value]
    if isinstance(value, dict):
        return {key: serialize(item) for key, item in value.items()}
    return value


class UseCaseRunner:
    def __init__(self) -> None:
        self.results: List[FlowResult] = []
        self.patients = PatientsService()
        self.doctors = DoctorsService()
        self.admins = AdminsService()
        self.medical_records = MedicalRecordsService()
        self._broker = get_dbbroker()

        # Baseline actors provided by the mock datasets.
        self.primary_patient = self._bootstrap_patient()
        self.primary_doctor = self._bootstrap_doctor()

        self._availability: Optional[Availability] = None
        self._booked_appointment: Optional[Appointment] = None
        self._latest_patient_id: Optional[int] = None

    def run(self) -> None:
        self._log("INFO", "Starting TurnoPlus use case verification script")
        self._record(
            "SETUP-01",
            "Paciente base cargado",
            self.primary_patient,
        )
        self._record(
            "SETUP-02",
            "Doctor base cargado",
            self.primary_doctor,
        )
        self._run_doctor_flows()
        self._run_patient_flows()
        self._run_admin_flows()
        self._log("INFO", "Use case flows completed")

    # ------------------------------------------------------------------ doctor flows
    def _run_doctor_flows(self) -> None:
        self._log("SECTION", "Ejecutando casos de uso para doctores")
        doctor_credentials = ("doctor1@example.com", "doctor1pass")

        authenticated = self.doctors.authenticate(*doctor_credentials)
        if authenticated:
            doctor, token = authenticated
            self._record("DOC-01", "Doctor inicia sesión", {"token": token, "doctor": doctor})
        else:
            self._record("DOC-01", "Doctor inicia sesión", error="Credenciales inválidas")
            return

        with self._broker.session() as session:
            appointments = AppointmentsService(session)
            existing_slots = appointments.list_availability(self.primary_doctor.id)

        if existing_slots:
            base_start = max(slot.end_at for slot in existing_slots) + timedelta(hours=1)
        else:
            base_start = datetime.now().replace(microsecond=0) + timedelta(days=1)

        start_at = base_start
        end_at = start_at + timedelta(hours=2)
        with self._broker.session() as session:
            appointments = AppointmentsService(session)
            availability = appointments.create_availability(
                AvailabilityCreate(
                    doctor_id=self.primary_doctor.id,
                    start_at=start_at,
                    end_at=end_at,
                    slots=2,
                )
            )
        self._availability = availability
        self._record("DOC-02", "Doctor ingresa disponibilidad", availability)

        with self._broker.session() as session:
            appointments = AppointmentsService(session)
            updated = appointments.update_availability(
                availability.id,
                AvailabilityUpdate(end_at=end_at + timedelta(hours=1)),
            )
        self._availability = updated
        self._record("DOC-03", "Doctor modifica disponibilidad", updated)

    # ------------------------------------------------------------------ patient flows
    def _run_patient_flows(self) -> None:
        self._log("SECTION", "Ejecutando casos de uso para pacientes")

        # USR-01 Register new patient
        try:
            new_patient = self.patients.create(
                PatientCreate(
                    email="new.patient@example.com",
                    password="patientpass",
                    is_active=True,
                    is_superuser=False,
                    full_name="Paciente Demo",
                    date_of_birth=self.primary_patient.date_of_birth,
                    medical_record_number="MRN-002",
                    emergency_contact="Contacto Demo",
                )
            )
            self._record("USR-01", "Usuario se registra", new_patient)
        except ValueError:
            fallback = self.patients.authenticate("new.patient@example.com", "patientpass")
            if not fallback:
                self._record("USR-01", "Usuario se registra", error="No se pudo reusar el usuario existente")
                return
            new_patient = fallback
            self._record("USR-01", "Usuario se registra (existente)", new_patient)

        self._latest_patient_id = new_patient.id

        # USR-02 Authenticate patient
        logged_patient = self.patients.authenticate("new.patient@example.com", "patientpass")
        if logged_patient:
            self._record("USR-02", "Usuario inicia sesión", {"patient": logged_patient})
        else:
            self._record("USR-02", "Usuario inicia sesión", error="Credenciales inválidas")
            return

        # USR-03 Update patient profile
        updated_patient = self.patients.update(
            new_patient.id,
            PatientUpdate(full_name="Paciente Demo Actualizado", emergency_contact="Contacto Actualizado"),
        )
        self._record("USR-03", "Usuario modifica sus datos personales", updated_patient)

        if not self._availability:
            self._record("USR-04", "Usuario solicita turno", error="No hay disponibilidad cargada")
            return

        # USR-04 Book appointment within availability window
        appointment_start = self._availability.start_at + timedelta(minutes=15)
        appointment_end = appointment_start + timedelta(minutes=30)
        with self._broker.session() as session:
            appointments = AppointmentsService(session)
            appointment = appointments.book(
                AppointmentCreate(
                    doctor_id=self.primary_doctor.id,
                    patient_id=new_patient.id,
                    start_at=appointment_start,
                    end_at=appointment_end,
                    notes="Consulta inicial",
                )
            )
        self._booked_appointment = appointment
        self._record("USR-04", "Usuario solicita turno", appointment)

        # USR-06 List appointments
        with self._broker.session() as session:
            appointments = AppointmentsService(session)
            upcoming = appointments.list_for_patient(new_patient.id)
        self._record("USR-06", "Usuario consulta turnos agendados", upcoming)

        # USR-05 Cancel appointment
        with self._broker.session() as session:
            appointments = AppointmentsService(session)
            canceled = appointments.cancel(appointment.id)
        self._record("USR-05", "Usuario cancela turno", canceled)

        # Re-book to continue with doctor flows (confirm / complete)
        new_start = appointment_end + timedelta(minutes=15)
        new_end = new_start + timedelta(minutes=30)
        with self._broker.session() as session:
            appointments = AppointmentsService(session)
            second_appointment = appointments.book(
                AppointmentCreate(
                    doctor_id=self.primary_doctor.id,
                    patient_id=new_patient.id,
                    start_at=new_start,
                    end_at=new_end,
                    notes="Seguimiento",
                )
            )
        self._booked_appointment = second_appointment
        self._record("USR-04B", "Usuario solicita nuevo turno", second_appointment)

        # USR-06 (again) after new booking
        with self._broker.session() as session:
            appointments = AppointmentsService(session)
            refreshed = appointments.list_for_patient(new_patient.id)
        self._record("USR-06B", "Usuario consulta turnos agendados (actualizado)", refreshed)

    # ------------------------------------------------------------------ admin flows
    def _run_admin_flows(self) -> None:
        self._log("SECTION", "Ejecutando casos de uso para administradores")

        admin_credentials = ("admin1@example.com", "admin1pass")
        authenticated = self.admins.authenticate(*admin_credentials)
        if not authenticated:
            try:
                seeded_admin = self.admins.create(
                    AdminCreate(
                        email=admin_credentials[0],
                        password=admin_credentials[1],
                        is_active=True,
                        is_superuser=True,
                        full_name="Admin Semilla",
                        role="superadmin",
                        permissions={"all"},
                    )
                )
                self._record("SEED-ADMIN", "Administrador semilla creado para pruebas", seeded_admin)
            except ValueError:
                pass
            authenticated = self.admins.authenticate(*admin_credentials)

        if authenticated:
            admin, token = authenticated
            self._record("ADMIN-01", "Administrador inicia sesión", {"token": token, "admin": admin})
        else:
            self._record("ADMIN-01", "Administrador inicia sesión", error="Credenciales inválidas")
            return

        # ADMIN-02: Administrator registers a new doctor
        unique_suffix = datetime.now().strftime("%Y%m%d%H%M%S")
        try:
            new_doctor = self.doctors.create(
                DoctorCreate(
                    email=f"new.doctor.{unique_suffix}@example.com",
                    password="doctorpass",
                    full_name="Doctora Demo",
                    specialty="Clínica Médica",
                    license_number=f"LIC-{unique_suffix}",
                    years_experience=6,
                )
            )
            self._record("ADMIN-02", "Administrador da de alta un nuevo doctor", new_doctor)
        except ValueError:
            doctors = self.doctors.list()
            new_doctor = doctors[-1] if doctors else self.primary_doctor
            self._record(
                "ADMIN-02",
                "Administrador da de alta un nuevo doctor",
                error="No se pudo crear un doctor nuevo; reusando existente",
            )

        # Doctor confirms appointment and actualiza ficha clínica
        medical_record = None
        if self._booked_appointment:
            with self._broker.session() as session:
                appointments = AppointmentsService(session)
                confirmed = appointments.confirm(self._booked_appointment.id)
            self._record("DOC-Confirm", "Doctor confirma turno", confirmed)
            with self._broker.session() as session:
                appointments = AppointmentsService(session)
                completed = appointments.complete(confirmed.id)
            self._record("DOC-Complete", "Doctor completa turno", completed)
            self._booked_appointment = completed

            with self._broker.session() as session:
                records_service = MedicalRecordsService(session)
                medical_record = records_service.create(
                    MedicalRecordCreate(
                        patient_id=completed.patient_id,
                        doctor_id=completed.doctor_id,
                        diagnosis="Chequeo general sin novedades",
                        treatment="Continuar controles periódicos",
                        notes="Registro inicial post consulta",
                    )
                )
            self._record("DOC-04", "Doctor crea ficha clínica", medical_record)

            with self._broker.session() as session:
                records_service = MedicalRecordsService(session)
                updated_record = records_service.update(
                    medical_record.id,
                    MedicalRecordUpdate(notes="Control actualizado con observaciones"),
                )
            self._record("DOC-04B", "Doctor modifica ficha clínica", updated_record)

            doctor_records = self.medical_records.list_for_doctor(completed.doctor_id)
            self._record("DOC-05", "Doctor consulta ficha clínica", doctor_records)

        if medical_record and self._latest_patient_id:
            patient_records = self.medical_records.list_for_patient(self._latest_patient_id)
            self._record("USR-07", "Usuario consulta ficha clínica", patient_records)

        # ADMIN-03: Administrator removes doctor
        removed = self.doctors.delete(new_doctor.id)
        if removed:
            self._record("ADMIN-03", "Administrador da de baja un doctor", {"doctor_id": new_doctor.id})
        else:
            self._record(
                "ADMIN-03",
                "Administrador da de baja un doctor",
                error=f"No se pudo eliminar el doctor {new_doctor.id}",
            )

        # ADMIN-04 / ADMIN-05 not yet implemented in the codebase.
        self._record("ADMIN-04", "Administrador crea consultorio", error="Pendiente de implementación")
        self._record("ADMIN-05", "Administrador elimina consultorio", error="Pendiente de implementación")

    # ------------------------------------------------------------------
    def dump_results(self) -> None:
        print(json.dumps([result.as_dict() for result in self.results], ensure_ascii=False, indent=2))

    def _record(self, case_id: str, description: str, payload: Any = None, error: Optional[str] = None) -> None:
        if isinstance(payload, (tuple, set)):
            payload = list(payload)
        result = FlowResult(case_id=case_id, description=description, payload=payload, error=error)
        self.results.append(result)
        status = "ERROR" if error else "OK"
        self._log(status, f"[{case_id}] {description}")

    def _bootstrap_patient(self) -> Patient:
        existing = self.patients.list()
        if existing:
            return existing[0]
        seeded = self.patients.create(
            PatientCreate(
                email="seed.patient@example.com",
                password="seedpatientpass",
                is_active=True,
                is_superuser=False,
                full_name="Paciente Semilla",
                date_of_birth=date(1990, 1, 1),
                medical_record_number="MRN-SEED",
                emergency_contact="Contacto Semilla",
            )
        )
        self._record("SEED-PATIENT", "Paciente semilla creado para pruebas", seeded)
        return seeded

    def _bootstrap_doctor(self) -> Doctor:
        existing = self.doctors.list()
        for doctor in existing:
            if doctor.email == "doctor1@example.com":
                return doctor
        if existing:
            return existing[0]
        try:
            seeded = self.doctors.create(
                DoctorCreate(
                    email="doctor1@example.com",
                    password="doctor1pass",
                    is_active=True,
                    is_superuser=False,
                    full_name="Doctor Semilla",
                    specialty="Clínica General",
                    license_number="LIC-SEED-001",
                    years_experience=10,
                )
            )
            self._record("SEED-DOCTOR", "Doctor semilla creado para pruebas", seeded)
            return seeded
        except ValueError:
            refreshed = self.doctors.list()
            if refreshed:
                return refreshed[0]
            raise RuntimeError("No se pudo inicializar un doctor base")

    @staticmethod
    def _log(level: str, message: str) -> None:
        now = datetime.now().strftime("%H:%M:%S")
        print(f"[{now}] {level:<7} {message}")


def main() -> int:
    runner = UseCaseRunner()
    try:
        runner.run()
    except ValidationError as exc:
        runner._record("ERROR", "Validación fallida durante la ejecución", error=str(exc))
        runner._log("ERROR", f"Validación fallida: {exc}")
        return 1
    runner.dump_results()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
