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

export interface AvailabilityDto {
  id: number;
  doctor_id: number;
  startAt: string;
  endAt: string;
  slots: number;
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
