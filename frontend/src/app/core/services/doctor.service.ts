import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../config/api.config';
import { DoctorDto } from '../models/user';

export interface DoctorCreate {
  email: string;
  password: string;
  full_name?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  specialty?: string;
  license_number?: string;
  years_experience?: number;
  office_id?: number;
}

export interface DoctorUpdate {
  password?: string;
  email?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  full_name?: string;
  specialty?: string;
  license_number?: string;
  years_experience?: number;
  office_id?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private readonly apiUrl = `${environment.apiBaseUrl}/doctors`;

  constructor(private http: HttpClient) {}

  getDoctors(): Observable<DoctorDto[]> {
    return this.http.get<DoctorDto[]>(this.apiUrl);
  }

  getDoctor(id: number): Observable<DoctorDto> {
    return this.http.get<DoctorDto>(`${this.apiUrl}/${id}`);
  }

  createDoctor(doctor: DoctorCreate): Observable<DoctorDto> {
    return this.http.post<DoctorDto>(this.apiUrl, doctor);
  }

  updateDoctor(id: number, doctor: DoctorUpdate): Observable<DoctorDto> {
    return this.http.put<DoctorDto>(`${this.apiUrl}/${id}`, doctor);
  }

  deleteDoctor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
