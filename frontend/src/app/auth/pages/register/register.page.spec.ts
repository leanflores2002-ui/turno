import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { RegisterPage } from './register.page';
import { AuthService } from '../../../core/services/auth.service';
import { AuthenticatedUser } from '../../../core/models/user';

describe('RegisterPage', () => {
  let fixture: ComponentFixture<RegisterPage>;
  let component: RegisterPage;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;
  let navigateSpy: jasmine.Spy;

  const patientUser: AuthenticatedUser = {
    id: 12,
    email: 'patient@example.com',
    fullName: 'Paciente Demo',
    role: 'patient',
    token: 'token-patient',
    tokenType: 'bearer'
  };

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['registerPatient']);
    await TestBed.configureTestingModule({
      imports: [RegisterPage, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authService }]
    }).compileComponents();

    router = TestBed.inject(Router);
    navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should show a validation error when passwords do not match', () => {
    component.form.setValue({
      full_name: 'Paciente Demo',
      email: 'patient@example.com',
      password: 'secret123',
      confirmPassword: 'different'
    });

    component.onSubmit();

    expect(authService.registerPatient).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('Las contraseñas no coinciden.');
  });

  it('should register the patient and redirect to the patient dashboard', () => {
    authService.registerPatient.and.returnValue(of(patientUser));

    component.form.setValue({
      full_name: 'Paciente Demo',
      email: 'patient@example.com',
      password: 'secret123',
      confirmPassword: 'secret123'
    });

    component.onSubmit();

    expect(authService.registerPatient).toHaveBeenCalledWith({
      full_name: 'Paciente Demo',
      email: 'patient@example.com',
      password: 'secret123'
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/patient']);
    expect(component.errorMessage).toBe('');
  });

  it('should show an error message when registration fails', () => {
    authService.registerPatient.and.returnValue(throwError(() => new Error('Fail')));

    component.form.setValue({
      full_name: '',
      email: 'patient@example.com',
      password: 'secret123',
      confirmPassword: 'secret123'
    });

    component.onSubmit();

    expect(navigateSpy).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('No pudimos crear tu cuenta. Probá más tarde.');
    expect(component.isSubmitting).toBeFalse();
  });
});
