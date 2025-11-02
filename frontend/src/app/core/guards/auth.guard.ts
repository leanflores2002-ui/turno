import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, UrlTree } from '@angular/router';

import { AuthService } from '../services/auth.service';

function redirectToLogin(redirectTo?: string): UrlTree {
  const router = inject(Router);
  return router.createUrlTree(['/auth/login'], {
    queryParams: redirectTo ? { redirectTo } : undefined
  });
}

function resolveUrlFromSegments(segments: readonly { path: string }[]): string {
  const url = segments.map((segment) => segment.path).join('/');
  return `/${url}`;
}

export const authCanActivateGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  if (authService.isAuthenticated) {
    return true;
  }
  return redirectToLogin(state.url);
};

export const authCanMatchGuard: CanMatchFn = (route, segments) => {
  const authService = inject(AuthService);
  if (authService.isAuthenticated) {
    return true;
  }
  const redirectTo = route.path ? `/${route.path}` : resolveUrlFromSegments(segments);
  return redirectToLogin(redirectTo);
};
