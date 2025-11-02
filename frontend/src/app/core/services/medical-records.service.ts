import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import {
  MedicalRecordCreateRequest,
  MedicalRecordDto,
  MedicalRecordUpdateRequest
} from '../models/medical-record';

@Injectable({ providedIn: 'root' })
export class MedicalRecordsService {
  private readonly http = inject(HttpClient);

  listForPatient(patientId: number): Observable<MedicalRecordDto[]> {
    return this.http.get<MedicalRecordDto[]>(`${API_BASE_URL}/medical-records/patients/${patientId}`);
  }

  listForDoctor(doctorId: number): Observable<MedicalRecordDto[]> {
    return this.http.get<MedicalRecordDto[]>(`${API_BASE_URL}/medical-records/doctors/${doctorId}`);
  }

  createRecord(payload: MedicalRecordCreateRequest): Observable<MedicalRecordDto> {
    return this.http.post<MedicalRecordDto>(`${API_BASE_URL}/medical-records`, payload);
  }

  updateRecord(
    recordId: number,
    payload: MedicalRecordUpdateRequest
  ): Observable<MedicalRecordDto> {
    return this.http.patch<MedicalRecordDto>(`${API_BASE_URL}/medical-records/${recordId}`, payload);
  }
}
