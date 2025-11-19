import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../config/api.config';
import { Office, OfficeCreate, OfficeUpdate } from '../models/office';

@Injectable({
  providedIn: 'root'
})
export class OfficeService {
  private readonly apiUrl = `${environment.apiBaseUrl}/offices`;

  constructor(private http: HttpClient) {}

  getOffices(): Observable<Office[]> {
    return this.http.get<Office[]>(this.apiUrl);
  }

  getOffice(id: number): Observable<Office> {
    return this.http.get<Office>(`${this.apiUrl}/${id}`);
  }

  createOffice(office: OfficeCreate): Observable<Office> {
    return this.http.post<Office>(this.apiUrl, office);
  }

  updateOffice(id: number, office: OfficeUpdate): Observable<Office> {
    return this.http.put<Office>(`${this.apiUrl}/${id}`, office);
  }

  deleteOffice(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
