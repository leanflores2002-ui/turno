import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  
  protected readonly currentYear = new Date().getFullYear();
  protected readonly isAuthenticated = computed(() => {
    const isAuth = this.authService.isAuthenticated;
    console.log('isAuthenticated computed:', { isAuth });
    return isAuth;
  });
  protected readonly user = this.authService.user;

  protected logout(): void {
    console.log('Logout called, user before:', this.authService.user());
    this.authService.logout();
    console.log('Logout called, user after:', this.authService.user());
    this.router.navigate(['/']);
  }
}
