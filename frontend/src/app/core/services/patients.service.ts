import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { PatientDto, PatientUpdateRequest } from '../models/user';

@Injectable({ providedIn: 'root' })
export class PatientsService {
  private readonly http = inject(HttpClient);

  getPatient(id: number): Observable<PatientDto> {
    return this.http.get<PatientDto>(`${API_BASE_URL}/patients/${id}`);
  }

  updatePatient(id: number, changes: PatientUpdateRequest): Observable<PatientDto> {
    return this.http.put<PatientDto>(`${API_BASE_URL}/patients/${id}`, changes);
  }
}
