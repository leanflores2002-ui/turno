import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Route, Router, UrlSegment, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { roleCanActivateGuard, roleCanMatchGuard } from './role.guard';
import { AuthenticatedUser } from '../models/user';
import { AuthService } from '../services/auth.service';

class AuthServiceStub {
  private currentUser: AuthenticatedUser | null = null;

  user = () => this.currentUser;

  setUser(user: AuthenticatedUser | null) {
    this.currentUser = user;
  }
}

describe('role guards', () => {
  let authService: AuthServiceStub;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: AuthService, useClass: AuthServiceStub }]
    });

    authService = TestBed.inject(AuthService) as unknown as AuthServiceStub;
    router = TestBed.inject(Router);
  });

  const patientUser: AuthenticatedUser = {
    id: 1,
    email: 'patient@example.com',
    fullName: 'Paciente Demo',
    role: 'patient',
    token: 'token-patient',
    tokenType: 'bearer'
  };

  const doctorUser: AuthenticatedUser = {
    id: 2,
    email: 'doctor@example.com',
    fullName: 'Doctor Demo',
    role: 'doctor',
    token: 'token-doctor',
    tokenType: 'bearer'
  };

  it('roleCanActivateGuard should allow access when user has an allowed role', () => {
    authService.setUser(doctorUser);

    const route = { data: { roles: ['doctor'] } } as unknown as ActivatedRouteSnapshot;
    const result = TestBed.runInInjectionContext(() => roleCanActivateGuard(route, {} as any));

    expect(result).toBeTrue();
  });

  it('roleCanActivateGuard should allow patients when roles includes patient or user', () => {
    authService.setUser({ ...patientUser, role: 'user' });

    const route = { data: { roles: ['patient'] } } as unknown as ActivatedRouteSnapshot;
    const result = TestBed.runInInjectionContext(() => roleCanActivateGuard(route, {} as any));

    expect(result).toBeTrue();
  });

  it('roleCanActivateGuard should redirect when user lacks role', () => {
    authService.setUser(patientUser);
    const route = { data: { roles: ['admin'] } } as unknown as ActivatedRouteSnapshot;

    const result = TestBed.runInInjectionContext(() => roleCanActivateGuard(route, {} as any)) as UrlTree;

    expect(router.serializeUrl(result)).toBe('/auth/login?unauthorized=1');
  });

  it('roleCanMatchGuard should redirect to login when user missing', () => {
    authService.setUser(null);
    const route = { data: { roles: ['doctor'] } } as Route;

    const result = TestBed.runInInjectionContext(() => roleCanMatchGuard(route, [] as UrlSegment[])) as UrlTree;

    expect(router.serializeUrl(result)).toBe('/auth/login?unauthorized=1');
  });

  it('roleCanMatchGuard should allow user when role matches', () => {
    authService.setUser(patientUser);
    const route = { data: { roles: ['patient', 'user'] } } as Route;

    const result = TestBed.runInInjectionContext(() => roleCanMatchGuard(route, [] as UrlSegment[]));

    expect(result).toBeTrue();
  });
});
