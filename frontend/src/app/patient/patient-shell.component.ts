import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../core/services/auth.service';
import { PatientsService } from '../core/services/patients.service';
import { AppointmentsService } from '../core/services/appointments.service';
import { MedicalRecordsService } from '../core/services/medical-records.service';
import { PatientDto, PatientUpdateRequest } from '../core/models/user';
import { MedicalRecordDto } from '../core/models/medical-record';
import { AppointmentDto } from '../core/models/appointment';
import { PatientProfileComponent } from './components/patient-profile/patient-profile.component';
import { PatientAppointmentsComponent } from './components/patient-appointments/patient-appointments.component';
import { PatientBookingComponent } from './components/patient-booking/patient-booking.component';
import { PatientMedicalRecordsComponent } from './components/patient-medical-records/patient-medical-records.component';
import { TabbedShellComponent, TabConfig } from '../shared/components/tabbed-shell/tabbed-shell.component';

@Component({
  selector: 'app-patient-shell',
  standalone: true,
  imports: [
    TabbedShellComponent,
    PatientProfileComponent,
    PatientAppointmentsComponent,
    PatientBookingComponent,
    PatientMedicalRecordsComponent
  ],
  templateUrl: './patient-shell.component.html',
  styleUrl: './patient-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientShellComponent {
  private readonly authService = inject(AuthService);
  private readonly patientsService = inject(PatientsService);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly medicalRecordsService = inject(MedicalRecordsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly profile = signal<PatientDto | null>(null);
  readonly appointments = signal<AppointmentDto[]>([]);
  readonly medicalRecords = signal<MedicalRecordDto[]>([]);
  readonly isLoadingProfile = signal<boolean>(false);
  readonly isLoadingAppointments = signal<boolean>(false);
  readonly isLoadingRecords = signal<boolean>(false);
  readonly isSavingProfile = signal<boolean>(false);
  readonly appointmentActionId = signal<number | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly recordsError = signal<string | null>(null);

  readonly sortedAppointments = computed(() =>
    [...this.appointments()].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    )
  );

  readonly hasContent = computed(() => !!this.profile() || this.appointments().length > 0);

  readonly tabs: TabConfig[] = [
    {
      id: 'profile',
      label: 'Mi Perfil',
      icon: 'person'
    },
    {
      id: 'appointments',
      label: 'Mis Turnos',
      icon: 'event'
    },
    {
      id: 'booking',
      label: 'Reservar Turno',
      icon: 'add_circle'
    },
    {
      id: 'records',
      label: 'Historial Médico',
      icon: 'medical_services'
    }
  ];

  constructor() {
    this.loadPatient();
    this.loadAppointments();
    this.loadMedicalRecords();
  }

  get currentUserId(): number | null {
    return this.authService.user()?.id ?? null;
  }

  refresh(): void {
    this.loadPatient();
    this.loadAppointments();
    this.loadMedicalRecords();
  }

  onAppointmentBooked(appointment: AppointmentDto): void {
    this.appointments.update((items) => [...items, appointment]);
    this.errorMessage.set(null);
    this.loadMedicalRecords();
  }

  onRefreshRecords(): void {
    this.loadMedicalRecords(true);
  }

  onProfileSave(changes: PatientUpdateRequest): void {
    const currentUser = this.authService.user();
    if (!currentUser) {
      this.errorMessage.set('No pudimos determinar tu sesión actual.');
      return;
    }
    this.isSavingProfile.set(true);
    this.errorMessage.set(null);
    this.patientsService
      .updatePatient(currentUser.id, changes)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (patient) => {
        this.profile.set(patient);
        this.isSavingProfile.set(false);
      },
      error: () => {
        this.isSavingProfile.set(false);
        this.errorMessage.set('No pudimos guardar los cambios. Intentá más tarde.');
      }
    });
  }

  onCancelAppointment(appointmentId: number): void {
    this.mutateAppointment(appointmentId, 'cancel');
  }

  onConfirmAppointment(appointmentId: number): void {
    this.mutateAppointment(appointmentId, 'confirm');
  }

  private mutateAppointment(appointmentId: number, action: 'cancel' | 'confirm'): void {
    this.appointmentActionId.set(appointmentId);
    this.errorMessage.set(null);
    const request =
      action === 'cancel'
        ? this.appointmentsService.cancel(appointmentId)
        : this.appointmentsService.confirm(appointmentId);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (updated) => {
        this.appointments.update((list) =>
          list.map((item) => (item.id === updated.id ? updated : item))
        );
        this.appointmentActionId.set(null);
      },
      error: () => {
        this.appointmentActionId.set(null);
        this.errorMessage.set('No pudimos actualizar el turno. Intentá nuevamente.');
      }
    });
  }

  private loadPatient(): void {
    const currentUser = this.authService.user();
    if (!currentUser) {
      this.errorMessage.set('Tu sesión no es válida. Ingresá nuevamente.');
      return;
    }
    this.isLoadingProfile.set(true);
    this.errorMessage.set(null);
    this.patientsService
      .getPatient(currentUser.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (patient) => {
        this.profile.set(patient);
        this.isLoadingProfile.set(false);
      },
      error: () => {
        this.isLoadingProfile.set(false);
        this.errorMessage.set('No pudimos cargar tu perfil. Intentá nuevamente.');
      }
    });
  }

  private loadAppointments(): void {
    const currentUser = this.authService.user();
    if (!currentUser) {
      return;
    }
    this.isLoadingAppointments.set(true);
    this.appointmentsService
      .listForPatient(currentUser.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (items) => {
        this.appointments.set(items);
        this.isLoadingAppointments.set(false);
      },
      error: () => {
        this.isLoadingAppointments.set(false);
        this.errorMessage.set('No pudimos obtener tus turnos.');
      }
    });
  }

  private loadMedicalRecords(force = false): void {
    const currentUser = this.authService.user();
    if (!currentUser) {
      this.recordsError.set('Tu sesión no es válida. Ingresá nuevamente.');
      return;
    }
    if (this.isLoadingRecords() && !force) {
      return;
    }
    this.isLoadingRecords.set(true);
    this.recordsError.set(null);
    this.medicalRecordsService
      .listForPatient(currentUser.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (records) => {
          this.medicalRecords.set(records);
          this.isLoadingRecords.set(false);
        },
        error: () => {
          this.isLoadingRecords.set(false);
          this.recordsError.set('No pudimos cargar tu historial médico.');
        }
      });
  }
}
