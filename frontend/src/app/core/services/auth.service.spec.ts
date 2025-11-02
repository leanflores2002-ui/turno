import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { API_BASE_URL } from '../config/api.config';
import { AuthenticatedUser } from '../models/user';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};
    spyOn(window.localStorage, 'getItem').and.callFake((key: string) => storage[key] ?? null);
    spyOn(window.localStorage, 'setItem').and.callFake((key: string, value: string) => {
      storage[key] = value;
    });
    spyOn(window.localStorage, 'removeItem').and.callFake((key: string) => {
      delete storage[key];
    });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should call the patient login endpoint and persist the session', () => {
    const credentials = { email: 'patient@example.com', password: 'secret123' };
    let responseUser: AuthenticatedUser | undefined;

    service.login('user', credentials).subscribe((user) => (responseUser = user));

    const request = httpMock.expectOne(`${API_BASE_URL}/users/login`);
    expect(request.request.method).toBe('POST');

    request.flush({
      access_token: 'abc123',
      token_type: 'bearer',
      user: {
        id: 1,
        email: credentials.email,
        full_name: 'Paciente Uno',
        is_active: true,
        is_superuser: false
      }
    });

    expect(window.localStorage.setItem).toHaveBeenCalledWith('turnoplus.token', 'abc123');
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'turnoplus.user',
      jasmine.stringMatching(/"email":"patient@example.com"/)
    );
    expect(service.token).toBe('abc123');
    expect(service.isAuthenticated).toBeTrue();
    expect(responseUser).toEqual(
      jasmine.objectContaining({
        id: 1,
        email: credentials.email,
        role: 'user'
      })
    );
  });

  it('should call the doctor login endpoint when logging in as doctor', () => {
    const credentials = { email: 'doctor@example.com', password: 'secret123' };

    service.login('doctor', credentials).subscribe();

    const request = httpMock.expectOne(`${API_BASE_URL}/doctors/login`);
    expect(request.request.method).toBe('POST');
    request.flush({
      access_token: 'token-doctor',
      token_type: 'bearer',
      user: {
        id: 5,
        email: credentials.email,
        full_name: 'Dra. Demo',
        is_active: true,
        is_superuser: false
      }
    });

    expect(service.role).toBe('doctor');
    expect(service.token).toBe('token-doctor');
  });

  it('should clear the session on logout', () => {
    service.logout();

    expect(window.localStorage.removeItem).toHaveBeenCalledWith('turnoplus.token');
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('turnoplus.user');
    expect(service.isAuthenticated).toBeFalse();
  });
});
