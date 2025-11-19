export interface MedicalRecordDto {
  id: number;
  patient_id: number;
  doctor_id: number | null;
  diagnosis: string | null;
  treatment: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  doctor_name?: string | null;
}

export interface MedicalRecordCreateRequest {
  patient_id: number;
  doctor_id?: number | null;
  diagnosis?: string | null;
  treatment?: string | null;
  notes?: string | null;
}

export interface MedicalRecordUpdateRequest {
  diagnosis?: string | null;
  treatment?: string | null;
  notes?: string | null;
}
