import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TabbedShellComponent, TabConfig } from '../shared/components/tabbed-shell/tabbed-shell.component';
import { DoctorManagementComponent } from './components/doctor-management/doctor-management.component';
import { OfficeManagementComponent } from './components/office-management/office-management.component';
import { UserManagementComponent } from './components/user-management/user-management.component';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [TabbedShellComponent, DoctorManagementComponent, OfficeManagementComponent, UserManagementComponent],
  template: `
    <app-tabbed-shell
      title="Panel del administrador"
      subtitle="Gestioná usuarios, doctores y configuración del sistema."
      [tabs]="tabs"
    >
      <div slot="actions">
        <button class="btn btn-primary" type="button">
          Configuración
        </button>
      </div>

      <div slot="dashboard">
        <div class="admin-dashboard">
          <div class="admin-dashboard__stats">
            <div class="stat-card">
              <h3>Usuarios Totales</h3>
              <p class="stat-number">0</p>
            </div>
            <div class="stat-card">
              <h3>Doctores Activos</h3>
              <p class="stat-number">0</p>
            </div>
            <div class="stat-card">
              <h3>Turnos Hoy</h3>
              <p class="stat-number">0</p>
            </div>
            <div class="stat-card">
              <h3>Registros Médicos</h3>
              <p class="stat-number">0</p>
            </div>
          </div>
          
          <div class="admin-dashboard__recent">
            <h3>Actividad Reciente</h3>
            <p class="placeholder">No hay actividad reciente para mostrar.</p>
          </div>
        </div>
      </div>

      <div slot="users">
        <app-user-management></app-user-management>
      </div>

      <div slot="doctors">
        <app-doctor-management></app-doctor-management>
      </div>

      <div slot="offices">
        <app-office-management></app-office-management>
      </div>

      <div slot="settings">
        <div class="admin-section">
          <h3>Configuración del Sistema</h3>
          <p class="placeholder">Configuraciones del sistema en desarrollo.</p>
        </div>
      </div>
    </app-tabbed-shell>
  `,
  styleUrl: './admin-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminShellComponent {
  readonly tabs: TabConfig[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard'
    },
    {
      id: 'users',
      label: 'Usuarios',
      icon: 'people'
    },
    {
      id: 'doctors',
      label: 'Doctores',
      icon: 'medical_services'
    },
    {
      id: 'offices',
      label: 'Consultorios',
      icon: 'business'
    },
    {
      id: 'settings',
      label: 'Configuración',
      icon: 'settings'
    }
  ];
}
