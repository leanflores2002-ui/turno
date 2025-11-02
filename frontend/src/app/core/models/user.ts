export type UserRole = 'user' | 'patient' | 'doctor' | 'admin';

export interface BaseUserDto {
  id: number;
  email: string;
  full_name?: string | null;
  is_active: boolean;
  is_superuser: boolean;
  password?: string;
}

export interface PatientDto extends BaseUserDto {
  date_of_birth?: string | null;
  medical_record_number?: string | null;
  emergency_contact?: string | null;
}

export interface DoctorDto extends BaseUserDto {
  specialty?: string | null;
  license_number?: string | null;
  years_experience?: number | null;
}

export interface AdminDto extends BaseUserDto {
  role?: 'superadmin' | 'manager' | 'support';
  permissions?: string[] | null;
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  fullName?: string | null;
  role: UserRole;
  token: string;
  tokenType: 'bearer';
}

export interface PatientUpdateRequest {
  password?: string | null;
  email?: string | null;
  is_active?: boolean | null;
  is_superuser?: boolean | null;
  full_name?: string | null;
  date_of_birth?: string | null;
  medical_record_number?: string | null;
  emergency_contact?: string | null;
}
