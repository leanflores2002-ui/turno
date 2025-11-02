import { Routes } from '@angular/router';

import { authCanActivateGuard, authCanMatchGuard } from './core/guards/auth.guard';
import { roleCanActivateGuard, roleCanMatchGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'auth/login'
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then((m) => m.authRoutes)
  },
  {
    path: 'patient',
    canMatch: [authCanMatchGuard, roleCanMatchGuard],
    canActivate: [authCanActivateGuard, roleCanActivateGuard],
    data: { roles: ['patient', 'user'] },
    loadComponent: () => import('./patient/patient-shell.component').then((m) => m.PatientShellComponent)
  },
  {
    path: 'doctor',
    canMatch: [authCanMatchGuard, roleCanMatchGuard],
    canActivate: [authCanActivateGuard, roleCanActivateGuard],
    data: { roles: ['doctor'] },
    loadComponent: () => import('./doctor/doctor-shell.component').then((m) => m.DoctorShellComponent)
  },
  {
    path: 'admin',
    canMatch: [authCanMatchGuard, roleCanMatchGuard],
    canActivate: [authCanActivateGuard, roleCanActivateGuard],
    data: { roles: ['admin'] },
    loadComponent: () => import('./admin/admin-shell.component').then((m) => m.AdminShellComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./shared/pages/not-found/not-found.page').then((m) => m.NotFoundPage)
  }
];
