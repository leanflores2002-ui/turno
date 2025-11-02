import { HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { authTokenInterceptor } from './auth-token.interceptor';
import { AuthService } from '../services/auth.service';

class AuthServiceStub {
  token: string | null = null;
  tokenType = 'bearer';
}

describe('authTokenInterceptor', () => {
  let authService: AuthServiceStub;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useClass: AuthServiceStub }]
    });

    authService = TestBed.inject(AuthService) as unknown as AuthServiceStub;
  });

  it('should attach Authorization header when a token is present', () => {
    authService.token = 'token-123';
    authService.tokenType = 'bearer';
    const request = new HttpRequest('GET', '/secure');

    const next = jasmine.createSpy('next').and.callFake((req: HttpRequest<unknown>) => of(req));

    const result$ = TestBed.runInInjectionContext(() => authTokenInterceptor(request, next));
    result$.subscribe(() => undefined);

    const forwardedRequest = next.calls.mostRecent().args[0] as HttpRequest<unknown>;
    expect(next).toHaveBeenCalled();
    expect(forwardedRequest.headers.get('Authorization')).toBe('Bearer token-123');
  });

  it('should skip header attachment when token is missing', () => {
    authService.token = null;
    const request = new HttpRequest('GET', '/public');
    const next = jasmine.createSpy('next').and.callFake((req: HttpRequest<unknown>) => of(req));

    const result$ = TestBed.runInInjectionContext(() => authTokenInterceptor(request, next));
    result$.subscribe(() => undefined);

    const forwardedRequest = next.calls.mostRecent().args[0] as HttpRequest<unknown>;
    expect(forwardedRequest.headers.has('Authorization')).toBeFalse();
  });
});
