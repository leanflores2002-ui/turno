import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/user';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: 'user' as UserRole
  });

  errorMessage = '';
  isSubmitting = false;

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.errorMessage = '';
    this.isSubmitting = true;

    const { email, password, role } = this.form.getRawValue();
    this.authService.login(role, { email, password }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.navigateByRole(role);
      },
      error: () => {
        this.isSubmitting = false;
        this.errorMessage = 'Credenciales inválidas. Intentá nuevamente.';
      }
    });
  }

  private navigateByRole(role: UserRole): void {
    switch (role) {
      case 'doctor':
        this.router.navigate(['/doctor']);
        break;
      case 'admin':
        this.router.navigate(['/admin']);
        break;
      default:
        this.router.navigate(['/patient']);
        break;
    }
  }
}
