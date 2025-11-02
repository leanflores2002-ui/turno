import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  template: `
    <section class="placeholder card">
      <h2>Panel del administrador</h2>
      <p>Estamos preparando la vista para gestionar usuarios, doctores y calendario global.</p>
    </section>
  `,
  styleUrl: './admin-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminShellComponent {}
