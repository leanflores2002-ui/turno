import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Route, Router, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { authCanActivateGuard, authCanMatchGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

class AuthServiceStub {
  isAuthenticated = false;
  token: string | null = null;
  tokenType = 'bearer';
  role: null = null;
  private currentUser: unknown = null;

  user = () => this.currentUser;

  setUser(user: unknown) {
    this.currentUser = user;
    this.isAuthenticated = !!user;
  }
}

describe('auth guards', () => {
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

  it('authCanActivateGuard should allow access when authenticated', () => {
    authService.isAuthenticated = true;

    const result = TestBed.runInInjectionContext(() =>
      authCanActivateGuard({} as ActivatedRouteSnapshot, { url: '/patient' } as RouterStateSnapshot)
    );

    expect(result).toBeTrue();
  });

  it('authCanActivateGuard should redirect to login when not authenticated', () => {
    authService.isAuthenticated = false;

    const result = TestBed.runInInjectionContext(() =>
      authCanActivateGuard({} as ActivatedRouteSnapshot, { url: '/doctor' } as RouterStateSnapshot)
    ) as UrlTree;

    expect(router.serializeUrl(result)).toBe('/auth/login?redirectTo=%2Fdoctor');
  });

  it('authCanMatchGuard should redirect unauthenticated users to login with redirectTo', () => {
    authService.isAuthenticated = false;
    const route = { path: 'admin' } as Route;
    const segments = [new UrlSegment('admin', {})];

    const result = TestBed.runInInjectionContext(() => authCanMatchGuard(route, segments)) as UrlTree;

    expect(router.serializeUrl(result)).toBe('/auth/login?redirectTo=%2Fadmin');
  });

  it('authCanMatchGuard should allow navigation when authenticated', () => {
    authService.isAuthenticated = true;
    const route = { path: 'patient' } as Route;
    const segments = [new UrlSegment('patient', {})];

    const result = TestBed.runInInjectionContext(() => authCanMatchGuard(route, segments));

    expect(result).toBeTrue();
  });
});
