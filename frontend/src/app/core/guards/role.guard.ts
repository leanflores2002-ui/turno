import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, CanMatchFn, Route, Router, UrlTree } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user';

type GuardRoute = ActivatedRouteSnapshot | Route;

function normalizeRoles(roles: unknown): UserRole[] {
  if (!Array.isArray(roles)) {
    return [];
  }
  return roles.filter((role): role is UserRole => typeof role === 'string');
}

function hasAllowedRole(userRole: UserRole, allowed: readonly UserRole[]): boolean {
  if (allowed.includes(userRole)) {
    return true;
  }
  if (userRole === 'user' && allowed.includes('patient')) {
    return true;
  }
  return false;
}

function handleUnauthorized(): UrlTree {
  const router = inject(Router);
  return router.createUrlTree(['/auth/login'], { queryParams: { unauthorized: '1' } });
}

function resolveAllowedRoles(route: GuardRoute | undefined): UserRole[] {
  return normalizeRoles(route?.data?.['roles']);
}

export const roleCanActivateGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const allowedRoles = resolveAllowedRoles(route);
  if (!allowedRoles.length) {
    return true;
  }
  const currentUser = authService.user();
  if (!currentUser) {
    return handleUnauthorized();
  }
  return hasAllowedRole(currentUser.role, allowedRoles) ? true : handleUnauthorized();
};

export const roleCanMatchGuard: CanMatchFn = (route) => {
  const authService = inject(AuthService);
  const allowedRoles = resolveAllowedRoles(route);
  if (!allowedRoles.length) {
    return true;
  }
  const currentUser = authService.user();
  if (!currentUser) {
    return handleUnauthorized();
  }
  return hasAllowedRole(currentUser.role, allowedRoles) ? true : handleUnauthorized();
};
