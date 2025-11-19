import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal
} from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../core/services/auth.service';
import { AppointmentsService } from '../core/services/appointments.service';
import { MedicalRecordsService } from '../core/services/medical-records.service';
import { DoctorsService } from '../core/services/doctors.service';
import { AppointmentDto, AvailabilityDto } from '../core/models/appointment';
import { MedicalRecordDto, MedicalRecordUpdateRequest } from '../core/models/medical-record';
import { PatientDto } from '../core/models/user';
import {
  DoctorAvailabilityComponent,
  DoctorAvailabilityCreateEvent,
  DoctorAvailabilityUpdateEvent
} from './components/doctor-availability/doctor-availability.component';
import {
  DoctorRecordUpdateEvent,
  DoctorRecordsComponent
} from './components/doctor-records/doctor-records.component';
import { TabbedShellComponent, TabConfig } from '../shared/components/tabbed-shell/tabbed-shell.component';

@Component({
  selector: 'app-doctor-shell',
  standalone: true,
  imports: [NgClass, DatePipe, TabbedShellComponent, DoctorAvailabilityComponent, DoctorRecordsComponent],
  templateUrl: './doctor-shell.component.html',
  styleUrl: './doctor-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DoctorShellComponent {
  private readonly authService = inject(AuthService);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly medicalRecordsService = inject(MedicalRecordsService);
  private readonly doctorsService = inject(DoctorsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly doctorId: number | null;
  private readonly doctorGreeting = signal<string | null>(null);

  readonly appointments = signal<AppointmentDto[]>([]);
  readonly availability = signal<AvailabilityDto[]>([]);
  readonly records = signal<MedicalRecordDto[]>([]);
  readonly patients = signal<PatientDto[]>([]);

  readonly appointmentsError = signal<string | null>(null);
  readonly availabilityError = signal<string | null>(null);
  readonly availabilityMessage = signal<string | null>(null);
  readonly recordsError = signal<string | null>(null);
  readonly recordsMessage = signal<string | null>(null);
  readonly patientsError = signal<string | null>(null);

  readonly isLoadingAppointments = signal<boolean>(false);
  readonly isLoadingAvailability = signal<boolean>(false);
  readonly isLoadingRecords = signal<boolean>(false);
  readonly isLoadingPatients = signal<boolean>(false);

  readonly isCreatingAvailability = signal<boolean>(false);
  readonly availabilityMutationId = signal<number | null>(null);

  readonly isSavingRecord = signal<boolean>(false);
  readonly recordMutationId = signal<number | null>(null);

  readonly sortedAppointments = computed(() =>
    [...this.appointments()].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    )
  );

  readonly doctorName = computed(() => this.doctorGreeting());

  readonly tabs: TabConfig[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard'
    },
    {
      id: 'availability',
      label: 'Disponibilidad',
      icon: 'schedule'
    },
    {
      id: 'appointments',
      label: 'Mis Turnos',
      icon: 'event'
    },
    {
      id: 'records',
      label: 'Registros Médicos',
      icon: 'medical_services'
    }
  ];

  constructor() {
    const currentUser = this.authService.user();
    if (!currentUser || currentUser.role !== 'doctor') {
      this.appointmentsError.set('No pudimos validar tu sesión de profesional.');
      this.availabilityError.set('No pudimos validar tu sesión de profesional.');
      this.recordsError.set('No pudimos validar tu sesión de profesional.');
      this.doctorId = null;
      return;
    }

    this.doctorId = currentUser.id;
    this.doctorGreeting.set(
      currentUser.fullName ?? `Profesional #${currentUser.id}`
    );

    this.loadAppointments();
    this.loadAvailability();
    this.loadRecords();
    this.loadPatients();
  }

  refreshAppointments(): void {
    this.loadAppointments(true);
  }

  refreshAvailability(): void {
    this.loadAvailability(true);
  }

  refreshRecords(): void {
    this.loadRecords(true);
  }

  refreshPatients(): void {
    this.loadPatients(true);
  }

  onCreateAvailability(event: DoctorAvailabilityCreateEvent): void {
    if (!this.ensureDoctorSession()) {
      return;
    }
    this.isCreatingAvailability.set(true);
    this.availabilityError.set(null);
    this.availabilityMessage.set(null);

    this.appointmentsService
      .createAvailability({
        doctor_id: this.doctorId as number,
        start_at: event.startAt,
        end_at: event.endAt
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (slot) => {
          this.availability.update((items) =>
            [...items, slot].sort(
              (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
            )
          );
          this.isCreatingAvailability.set(false);
          this.availabilityMessage.set('Disponibilidad agregada correctamente.');
        },
        error: (error) => {
          this.isCreatingAvailability.set(false);
          let errorMessage = 'No pudimos agregar la disponibilidad. Reintentá más tarde.';
          
          if (error.error?.detail) {
            const detail = error.error.detail;
            if (detail.includes('Overlapping availability slot')) {
              errorMessage = 'Ya tenés disponibilidad en este horario. Elegí otro horario o fecha.';
            } else if (detail.includes('Start time must align with block boundaries')) {
              errorMessage = 'El horario de inicio debe ser en punto (ej: 9:00, 10:00, 11:00).';
            } else if (detail.includes('Duration must be a multiple of')) {
              errorMessage = 'La duración debe ser múltiplo de 30 minutos.';
            } else if (detail.includes('Doctor not found')) {
              errorMessage = 'No se encontró el profesional. Recargá la página.';
            } else {
              errorMessage = detail;
            }
          }
          
          this.availabilityError.set(errorMessage);
        }
      });
  }

  onUpdateAvailability(event: DoctorAvailabilityUpdateEvent): void {
    if (!this.ensureDoctorSession()) {
      return;
    }
    this.availabilityMutationId.set(event.id);
    this.availabilityError.set(null);
    this.availabilityMessage.set(null);

    this.appointmentsService
      .updateAvailability(event.id, {})
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.availability.update((items) =>
            items
              .map((slot) => (slot.id === updated.id ? updated : slot))
              .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
          );
          this.availabilityMutationId.set(null);
          this.availabilityMessage.set('Actualizamos tu disponibilidad.');
        },
        error: () => {
          this.availabilityMutationId.set(null);
          this.availabilityError.set('No pudimos actualizar la disponibilidad.');
        }
      });
  }

  // Record creation is now handled in the modal component

  onUpdateRecord(event: DoctorRecordUpdateEvent): void {
    this.persistRecordChanges(event.recordId, event.changes);
  }

  private loadAppointments(force = false): void {
    if (!this.ensureDoctorSession()) {
      return;
    }
    if (this.isLoadingAppointments() && !force) {
      return;
    }
    this.isLoadingAppointments.set(true);
    this.appointmentsError.set(null);

    this.appointmentsService
      .listForDoctor(this.doctorId as number)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.appointments.set(
            items.sort(
              (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
            )
          );
          this.isLoadingAppointments.set(false);
        },
        error: () => {
          this.isLoadingAppointments.set(false);
          this.appointmentsError.set('No pudimos obtener tus turnos programados.');
        }
      });
  }

  private loadAvailability(force = false): void {
    if (!this.ensureDoctorSession()) {
      return;
    }
    if (this.isLoadingAvailability() && !force) {
      return;
    }
    this.isLoadingAvailability.set(true);
    this.availabilityError.set(null);

    this.appointmentsService
      .listDoctorAvailability(this.doctorId as number)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (slots) => {
          this.availability.set(
            slots.sort(
              (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
            )
          );
          this.isLoadingAvailability.set(false);
        },
        error: () => {
          this.isLoadingAvailability.set(false);
          this.availabilityError.set('No pudimos cargar tu agenda disponible.');
        }
      });
  }

  private loadRecords(force = false): void {
    if (!this.ensureDoctorSession()) {
      return;
    }
    if (this.isLoadingRecords() && !force) {
      return;
    }
    this.isLoadingRecords.set(true);
    this.recordsError.set(null);

    this.medicalRecordsService
      .listForDoctor(this.doctorId as number)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.records.set(
            items.sort(
              (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            )
          );
          this.isLoadingRecords.set(false);
        },
        error: () => {
          this.isLoadingRecords.set(false);
          this.recordsError.set('No pudimos obtener tus registros clínicos.');
        }
      });
  }

  private loadPatients(force = false): void {
    if (!this.ensureDoctorSession()) {
      return;
    }
    if (this.isLoadingPatients() && !force) {
      return;
    }
    this.isLoadingPatients.set(true);
    this.patientsError.set(null);

    this.doctorsService
      .getDoctorPatients(this.doctorId as number)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.patients.set(items);
          this.isLoadingPatients.set(false);
        },
        error: () => {
          this.isLoadingPatients.set(false);
          this.patientsError.set('No pudimos obtener tus pacientes.');
        }
      });
  }

  private persistRecordChanges(
    recordId: number,
    changes: MedicalRecordUpdateRequest
  ): void {
    if (!this.ensureDoctorSession()) {
      return;
    }
    this.recordMutationId.set(recordId);
    this.recordsError.set(null);
    this.recordsMessage.set(null);

    this.medicalRecordsService
      .updateRecord(recordId, changes)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.records.update((items) =>
            items
              .map((record) => (record.id === updated.id ? updated : record))
              .sort(
                (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
              )
          );
          this.recordMutationId.set(null);
          this.recordsMessage.set('Registro actualizado correctamente.');
        },
        error: () => {
          this.recordMutationId.set(null);
          this.recordsError.set('No pudimos actualizar el registro.');
        }
      });
  }

  private ensureDoctorSession(): boolean {
    if (!this.doctorId) {
      this.appointmentsError.set('Reiniciá tu sesión para continuar.');
      this.availabilityError.set('Reiniciá tu sesión para continuar.');
      this.recordsError.set('Reiniciá tu sesión para continuar.');
      this.patientsError.set('Reiniciá tu sesión para continuar.');
      return false;
    }
    return true;
  }
}
