import { AdminDto, DoctorDto, PatientDto, UserRole } from './user';

export interface LoginRequest {
  email: string;
  password: string;
}

export type LoginResponseDto =
  | UserLoginResponseDto
  | DoctorLoginResponseDto
  | AdminLoginResponseDto;

export interface LoginResponseBaseDto<TUser> {
  access_token: string;
  token_type: 'bearer';
  user: TUser;
}

export type UserLoginResponseDto = LoginResponseBaseDto<PatientDto>;
export type DoctorLoginResponseDto = LoginResponseBaseDto<DoctorDto>;
export type AdminLoginResponseDto = LoginResponseBaseDto<AdminDto>;

export interface PatientRegisterRequest {
  email: string;
  password: string;
  full_name?: string | null;
  date_of_birth?: string | null;
  medical_record_number?: string | null;
  emergency_contact?: string | null;
}

export interface AuthSession {
  token: string;
  tokenType: 'bearer';
  role: UserRole;
}
