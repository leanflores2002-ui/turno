import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { 
  SystemSettingDto, 
  SystemSettingUpdateRequest, 
  BlockDurationConfig 
} from '../models/appointment';

@Injectable({
  providedIn: 'root'
})
export class SystemSettingsService {
  private readonly apiUrl = `${API_BASE_URL}/settings`;

  constructor(private http: HttpClient) {}

  /**
   * Get all system settings
   */
  getAllSettings(): Observable<SystemSettingDto[]> {
    return this.http.get<SystemSettingDto[]>(this.apiUrl);
  }

  /**
   * Get the current appointment block duration in minutes
   */
  getBlockDuration(): Observable<BlockDurationConfig> {
    return this.http.get<BlockDurationConfig>(`${this.apiUrl}/block-duration`);
  }

  /**
   * Update the appointment block duration setting (admin only)
   */
  updateBlockDuration(duration: number): Observable<SystemSettingDto> {
    const request: SystemSettingUpdateRequest = {
      settingValue: duration.toString()
    };
    return this.http.put<SystemSettingDto>(`${this.apiUrl}/block-duration`, request);
  }
}
