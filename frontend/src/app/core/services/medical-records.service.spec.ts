import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { MedicalRecordsService } from './medical-records.service';
import { API_BASE_URL } from '../config/api.config';
import {
  MedicalRecordCreateRequest,
  MedicalRecordDto,
  MedicalRecordUpdateRequest
} from '../models/medical-record';

describe('MedicalRecordsService', () => {
  let service: MedicalRecordsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(MedicalRecordsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should fetch medical records for a patient', () => {
    let response: MedicalRecordDto[] | undefined;

    service.listForPatient(42).subscribe((records) => (response = records));

    const request = httpMock.expectOne(`${API_BASE_URL}/medical-records/patients/42`);
    expect(request.request.method).toBe('GET');

    const payload: MedicalRecordDto[] = [
      {
        id: 1,
        patient_id: 42,
        doctor_id: 3,
        diagnosis: 'Diagnóstico demo',
        treatment: 'Tratamiento demo',
        notes: 'Notas demo',
        created_at: '2025-10-10T10:00:00Z',
        updated_at: '2025-10-12T12:00:00Z'
      }
    ];

    request.flush(payload);
    expect(response).toEqual(payload);
  });

  it('should fetch medical records for a doctor', () => {
    let response: MedicalRecordDto[] | undefined;

    service.listForDoctor(9).subscribe((records) => (response = records));

    const request = httpMock.expectOne(`${API_BASE_URL}/medical-records/doctors/9`);
    expect(request.request.method).toBe('GET');

    request.flush([]);
    expect(response).toEqual([]);
  });

  it('should create a medical record', () => {
    const payload: MedicalRecordCreateRequest = {
      patient_id: 12,
      doctor_id: 9,
      diagnosis: 'Chequeo',
      treatment: 'Reposo',
      notes: 'Control en 15 días'
    };

    service.createRecord(payload).subscribe();

    const request = httpMock.expectOne(`${API_BASE_URL}/medical-records`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
  });

  it('should update a medical record', () => {
    const payload: MedicalRecordUpdateRequest = { notes: 'Actualización' };

    service.updateRecord(5, payload).subscribe();

    const request = httpMock.expectOne(`${API_BASE_URL}/medical-records/5`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(payload);
  });
});
