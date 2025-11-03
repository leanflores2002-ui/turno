import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { LoginRequest, LoginResponseDto, PatientRegisterRequest } from '../models/auth';
import { AuthenticatedUser, PatientDto, UserRole } from '../models/user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storageTokenKey = 'turnoplus.token';
  private readonly storageUserKey = 'turnoplus.user';
  private readonly _user: WritableSignal<AuthenticatedUser | null>;

  constructor() {
    this._user = signal(this.loadStoredUser());
  }

  get user() {
    return this._user.asReadonly();
  }

  get isAuthenticated(): boolean {
    return !!this._user();
  }

  get token(): string | null {
    return this._user()?.token ?? null;
  }

  get tokenType(): string {
    return this._user()?.tokenType ?? 'bearer';
  }

  get role(): UserRole | null {
    return this._user()?.role ?? null;
  }

  login(role: UserRole, payload: LoginRequest): Observable<AuthenticatedUser> {
    const endpoint = this.resolveLoginEndpoint(role);
    return this.http
      .post<LoginResponseDto>(`${API_BASE_URL}${endpoint}`, payload)
      .pipe(
        map((response) => this.normalizeLoginResponse(response, role)),
        tap((user) => this.persistSession(user))
      );
  }

  registerPatient(payload: PatientRegisterRequest): Observable<AuthenticatedUser> {
    return this.http.post<PatientDto>(`${API_BASE_URL}/patients`, payload).pipe(
      map((patient) =>
        this.normalizeLoginResponse(
          {
            access_token: `user-token-${patient.id}`,
            token_type: 'bearer',
            user: patient
          },
          'user' // Frontend uses 'user' for patients
        )
      ),
      tap((user) => this.persistSession(user))
    );
  }

  logout(): void {
    console.log('AuthService logout called, user before:', this._user());
    localStorage.removeItem(this.storageTokenKey);
    localStorage.removeItem(this.storageUserKey);
    this._user.set(null);
    console.log('AuthService logout called, user after:', this._user());
  }

  private persistSession(user: AuthenticatedUser): void {
    localStorage.setItem(this.storageTokenKey, user.token);
    localStorage.setItem(
      this.storageUserKey,
      JSON.stringify({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        tokenType: user.tokenType
      })
    );
    this._user.set(user);
  }

  private loadStoredUser(): AuthenticatedUser | null {
    const stored = localStorage.getItem(this.storageUserKey);
    const token = localStorage.getItem(this.storageTokenKey);
    if (!stored || !token) {
      return null;
    }
    try {
      const parsed = JSON.parse(stored);
      return {
        id: parsed.id,
        email: parsed.email,
        fullName: parsed.fullName,
        role: parsed.role,
        token,
        tokenType: parsed.tokenType ?? 'bearer'
      };
    } catch {
      localStorage.removeItem(this.storageTokenKey);
      localStorage.removeItem(this.storageUserKey);
      return null;
    }
  }

  private normalizeLoginResponse(
    response: LoginResponseDto,
    role: UserRole
  ): AuthenticatedUser {
    const { user, access_token: token, token_type: tokenType } = response;
    
    // Map backend role to frontend role
    let normalizedRole = role;
    if (role === 'patient' || (user as any).role === 'patient') {
      normalizedRole = 'user'; // Frontend uses 'user' for patients
    }
    
    return {
      id: user.id,
      email: user.email,
      fullName: 'full_name' in user ? (user.full_name as string | undefined) : undefined,
      role: normalizedRole,
      token,
      tokenType
    };
  }

  private resolveLoginEndpoint(role: UserRole): string {
    switch (role) {
      case 'doctor':
        return '/doctors/login';
      case 'admin':
        return '/admins/login';
      case 'patient':
      case 'user': // Map 'user' to patient login
        return '/users/login';
      default:
        return '/users/login';
    }
  }
}
