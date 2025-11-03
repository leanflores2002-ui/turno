import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import {
  AppointmentBlockDto,
  AppointmentCreateRequest,
  AppointmentDto,
  AvailabilityCreateRequest,
  AvailabilityDto,
  AvailabilityUpdateRequest
} from '../models/appointment';

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private readonly http = inject(HttpClient);

  listForPatient(patientId: number): Observable<AppointmentDto[]> {
    return this.http.get<AppointmentDto[]>(`${API_BASE_URL}/appointments/patients/${patientId}`);
  }

  listForDoctor(doctorId: number): Observable<AppointmentDto[]> {
    return this.http.get<AppointmentDto[]>(`${API_BASE_URL}/appointments/doctors/${doctorId}`);
  }

  cancel(appointmentId: number): Observable<AppointmentDto> {
    return this.http.post<AppointmentDto>(`${API_BASE_URL}/appointments/${appointmentId}/cancel`, {});
  }

  confirm(appointmentId: number): Observable<AppointmentDto> {
    return this.http.post<AppointmentDto>(`${API_BASE_URL}/appointments/${appointmentId}/confirm`, {});
  }

  listDoctorAvailability(doctorId: number): Observable<AvailabilityDto[]> {
    return this.http.get<AvailabilityDto[]>(`${API_BASE_URL}/appointments/doctor/${doctorId}/availability`);
  }

  createAvailability(payload: AvailabilityCreateRequest): Observable<AvailabilityDto> {
    return this.http.post<AvailabilityDto>(`${API_BASE_URL}/appointments/availability`, payload);
  }

  updateAvailability(
    availabilityId: number,
    payload: AvailabilityUpdateRequest
  ): Observable<AvailabilityDto> {
    return this.http.patch<AvailabilityDto>(
      `${API_BASE_URL}/appointments/availability/${availabilityId}`,
      payload
    );
  }

  book(payload: AppointmentCreateRequest): Observable<AppointmentDto> {
    return this.http.post<AppointmentDto>(`${API_BASE_URL}/appointments`, payload);
  }

  /**
   * Get available appointment blocks for a doctor within a date range
   */
  getAvailableBlocks(
    doctorId: number, 
    startDate: string, 
    endDate: string
  ): Observable<AppointmentBlockDto[]> {
    return this.http.get<AppointmentBlockDto[]>(
      `${API_BASE_URL}/doctors/${doctorId}/available-blocks?start_date=${startDate}&end_date=${endDate}`
    );
  }
}
