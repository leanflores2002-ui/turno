export type AppointmentStatus = 'pending' | 'confirmed' | 'canceled' | 'completed';

export interface AppointmentDto {
  id: number;
  doctor_id: number;
  patient_id: number;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  notes?: string | null;
}

export interface AppointmentCreateRequest {
  doctor_id: number;
  patient_id: number;
  start_at: string;
  end_at: string;
  notes?: string | null;
}

export interface AppointmentBlockDto {
  id: number;
  availabilityId: number;
  blockNumber: number;
  startAt: string;
  endAt: string;
  isBooked: boolean;
}

export interface AvailabilityDto {
  id: number;
  doctor_id: number;
  startAt: string;
  endAt: string;
  slots: number;
  blocks: AppointmentBlockDto[];
}

export interface AvailabilityCreateRequest {
  doctor_id: number;
  start_at: string;
  end_at: string;
  slots?: number;
}

export interface AvailabilityUpdateRequest {
  start_at?: string;
  end_at?: string;
  slots?: number;
}

export interface SystemSettingDto {
  id: number;
  settingKey: string;
  settingValue: string;
  description?: string;
}

export interface SystemSettingUpdateRequest {
  settingValue: string;
}

export interface BlockDurationConfig {
  blockDurationMinutes: number;
}
