#!/usr/bin/env python
"""Quick smoke-test script that exercises key FastAPI endpoints against the live DB."""
from __future__ import annotations

import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List


ROOT_DIR = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT_DIR / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import create_app  # noqa: E402


def iso(dt: datetime) -> str:
    value = dt.replace(microsecond=0).isoformat()
    if value.endswith("+00:00"):
        value = value[:-6] + "Z"
    return value


def expect_status(response, expected: int, *, label: str) -> Dict[str, Any]:
    if response.status_code != expected:
        raise RuntimeError(
            f"{label} failed: expected HTTP {expected}, got {response.status_code}: {response.text}"
        )
    try:
        return response.json()
    except json.JSONDecodeError:
        return {"raw": response.text}


def main() -> int:
    client = TestClient(create_app())

    report: List[Dict[str, Any]] = []
    suffix = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")

    # Health check
    health = expect_status(client.get("/healthz"), 200, label="healthz")
    report.append({"step": "healthz", "result": health})

    # Create patient
    patient_payload = {
        "email": f"patient.{suffix}@example.com",
        "password": "patientpass",
        "is_active": True,
        "is_superuser": False,
        "full_name": "Paciente API",
        "date_of_birth": "1990-01-01",
        "medical_record_number": f"MRN-{suffix}",
        "emergency_contact": "Contacto API",
    }
    patient = expect_status(
        client.post("/api/v1/patients/", json=patient_payload),
        201,
        label="create_patient",
    )
    report.append({"step": "create_patient", "result": patient})
    patient_id = patient["id"]

    # Create doctor
    doctor_password = "doctorpass"
    doctor_payload = {
        "email": f"doctor.{suffix}@example.com",
        "password": doctor_password,
        "is_active": True,
        "is_superuser": False,
        "full_name": "Doctor API",
        "specialty": "Clínica Médica",
        "license_number": f"LIC-{suffix}",
        "years_experience": 5,
    }
    doctor = expect_status(
        client.post("/api/v1/doctors/", json=doctor_payload),
        201,
        label="create_doctor",
    )
    report.append({"step": "create_doctor", "result": doctor})
    doctor_id = doctor["id"]

    # Doctor login
    login = expect_status(
        client.post(
            "/api/v1/doctors/login",
            json={"email": doctor_payload["email"], "password": doctor_password},
        ),
        200,
        label="doctor_login",
    )
    report.append({"step": "doctor_login", "result": {"access_token": login["access_token"]}})

    # Create availability
    start_at = datetime.now(timezone.utc) + timedelta(days=1)
    end_at = start_at + timedelta(hours=1)
    availability_payload = {
        "doctor_id": doctor_id,
        "start_at": iso(start_at),
        "end_at": iso(end_at),
        "slots": 2,
    }
    availability = expect_status(
        client.post("/api/v1/appointments/availability", json=availability_payload),
        201,
        label="create_availability",
    )
    report.append({"step": "create_availability", "result": availability})

    # Book appointment
    appointment_payload = {
        "doctor_id": doctor_id,
        "patient_id": patient_id,
        "start_at": iso(start_at + timedelta(minutes=15)),
        "end_at": iso(start_at + timedelta(minutes=45)),
        "notes": "Consulta API",
    }
    appointment = expect_status(
        client.post("/api/v1/appointments/", json=appointment_payload),
        201,
        label="book_appointment",
    )
    report.append({"step": "book_appointment", "result": appointment})
    appointment_id = appointment["id"]

    # Confirm and complete
    confirmed = expect_status(
        client.post(f"/api/v1/appointments/{appointment_id}/confirm"),
        200,
        label="confirm_appointment",
    )
    report.append({"step": "confirm_appointment", "result": confirmed})

    completed = expect_status(
        client.post(f"/api/v1/appointments/{appointment_id}/complete"),
        200,
        label="complete_appointment",
    )
    report.append({"step": "complete_appointment", "result": completed})

    # Retrieve appointments for the patient
    appointments = expect_status(
        client.get(f"/api/v1/appointments/patients/{patient_id}"),
        200,
        label="list_patient_appointments",
    )
    report.append({"step": "list_patient_appointments", "result": appointments})

    # Create medical record
    record_payload = {
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "diagnosis": "Chequeo general",
        "treatment": "Continuar controles",
        "notes": "Registro inicial desde API",
    }
    medical_record = expect_status(
        client.post("/api/v1/medical-records/", json=record_payload),
        201,
        label="create_medical_record",
    )
    report.append({"step": "create_medical_record", "result": medical_record})

    updated_record = expect_status(
        client.patch(
            f"/api/v1/medical-records/{medical_record['id']}",
            json={"notes": "Registro actualizado via API"},
        ),
        200,
        label="update_medical_record",
    )
    report.append({"step": "update_medical_record", "result": updated_record})

    patient_records = expect_status(
        client.get(f"/api/v1/medical-records/patients/{patient_id}"),
        200,
        label="list_patient_records",
    )
    report.append({"step": "list_patient_records", "result": patient_records})

    doctor_records = expect_status(
        client.get(f"/api/v1/medical-records/doctors/{doctor_id}"),
        200,
        label="list_doctor_records",
    )
    report.append({"step": "list_doctor_records", "result": doctor_records})

    # Output compact summary
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
