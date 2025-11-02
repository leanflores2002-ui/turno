import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { PatientsService } from './patients.service';
import { API_BASE_URL } from '../config/api.config';
import { PatientDto } from '../models/user';

describe('PatientsService', () => {
  let service: PatientsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(PatientsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch a patient profile by id', () => {
    let response: PatientDto | undefined;

    service.getPatient(42).subscribe((patient) => (response = patient));

    const request = httpMock.expectOne(`${API_BASE_URL}/patients/42`);
    expect(request.request.method).toBe('GET');

    const payload: PatientDto = {
      id: 42,
      email: 'patient@example.com',
      password: '***',
      is_active: true,
      is_superuser: false,
      full_name: 'Paciente Demo',
      date_of_birth: '1990-01-01',
      medical_record_number: 'HC-100',
      emergency_contact: 'Contacto Demo'
    };

    request.flush(payload);

    expect(response).toEqual(payload);
  });

  it('should update the patient profile with provided changes', () => {
    const changes = { full_name: 'Nuevo Nombre', emergency_contact: 'Contacto' };

    service.updatePatient(10, changes).subscribe();

    const request = httpMock.expectOne(`${API_BASE_URL}/patients/10`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(changes);
  });
});
