import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { DoctorDto, PatientDto } from '../models/user';

@Injectable({ providedIn: 'root' })
export class DoctorsService {
  private readonly http = inject(HttpClient);

  listDoctors(): Observable<DoctorDto[]> {
    return this.http.get<DoctorDto[]>(`${API_BASE_URL}/doctors/`);
  }

  getDoctorPatients(doctorId: number): Observable<PatientDto[]> {
    return this.http.get<PatientDto[]>(`${API_BASE_URL}/doctors/${doctorId}/patients`);
  }
}
