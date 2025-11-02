import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { LoginPage } from './login.page';
import { AuthService } from '../../../core/services/auth.service';
import { AuthenticatedUser } from '../../../core/models/user';

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let component: LoginPage;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;
  let navigateSpy: jasmine.Spy;

  const doctorUser: AuthenticatedUser = {
    id: 7,
    email: 'doctor@example.com',
    fullName: 'Dr. Demo',
    role: 'doctor',
    token: 'token-doctor',
    tokenType: 'bearer'
  };

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['login']);
    await TestBed.configureTestingModule({
      imports: [LoginPage, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authService }]
    }).compileComponents();

    router = TestBed.inject(Router);
    navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should submit credentials and redirect to the selected role dashboard', () => {
    authService.login.and.returnValue(of(doctorUser));

    component.form.setValue({
      email: 'doctor@example.com',
      password: 'secret123',
      role: 'doctor'
    });

    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith('doctor', {
      email: 'doctor@example.com',
      password: 'secret123'
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/doctor']);
    expect(component.errorMessage).toBe('');
  });

  it('should show an error when the backend rejects the credentials', () => {
    authService.login.and.returnValue(throwError(() => new Error('Invalid credentials')));

    component.form.setValue({
      email: 'wrong@example.com',
      password: 'secret123',
      role: 'user'
    });

    component.onSubmit();

    expect(navigateSpy).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('Credenciales inválidas. Intentá nuevamente.');
    expect(component.isSubmitting).toBeFalse();
  });
});
