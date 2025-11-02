import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthService } from '../services/auth.service';

function formatTokenType(tokenType: string): string {
  if (!tokenType) {
    return 'Bearer';
  }
  const lower = tokenType.toLowerCase();
  return `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
}

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token;
  if (!token || req.headers.has('Authorization')) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `${formatTokenType(authService.tokenType)} ${token}`
    }
  });
  return next(authReq);
};
