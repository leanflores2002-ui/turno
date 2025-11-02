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
import { AppointmentDto, AvailabilityDto } from '../core/models/appointment';
import { MedicalRecordDto, MedicalRecordUpdateRequest } from '../core/models/medical-record';
import {
  DoctorAvailabilityComponent,
  DoctorAvailabilityCreateEvent,
  DoctorAvailabilityUpdateEvent
} from './components/doctor-availability/doctor-availability.component';
import {
  DoctorRecordCreateEvent,
  DoctorRecordUpdateEvent,
  DoctorRecordsComponent
} from './components/doctor-records/doctor-records.component';

@Component({
  selector: 'app-doctor-shell',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, DatePipe, DoctorAvailabilityComponent, DoctorRecordsComponent],
  templateUrl: './doctor-shell.component.html',
  styleUrl: './doctor-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DoctorShellComponent {
  private readonly authService = inject(AuthService);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly medicalRecordsService = inject(MedicalRecordsService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly doctorId: number | null;
  private readonly doctorGreeting = signal<string | null>(null);

  readonly appointments = signal<AppointmentDto[]>([]);
  readonly availability = signal<AvailabilityDto[]>([]);
  readonly records = signal<MedicalRecordDto[]>([]);

  readonly appointmentsError = signal<string | null>(null);
  readonly availabilityError = signal<string | null>(null);
  readonly availabilityMessage = signal<string | null>(null);
  readonly recordsError = signal<string | null>(null);
  readonly recordsMessage = signal<string | null>(null);

  readonly isLoadingAppointments = signal<boolean>(false);
  readonly isLoadingAvailability = signal<boolean>(false);
  readonly isLoadingRecords = signal<boolean>(false);

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
        end_at: event.endAt,
        slots: event.slots
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
        error: () => {
          this.isCreatingAvailability.set(false);
          this.availabilityError.set('No pudimos agregar la disponibilidad. Reintentá más tarde.');
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
      .updateAvailability(event.id, { slots: event.slots })
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

  onCreateRecord(event: DoctorRecordCreateEvent): void {
    if (!this.ensureDoctorSession()) {
      return;
    }
    this.isSavingRecord.set(true);
    this.recordsError.set(null);
    this.recordsMessage.set(null);

    this.medicalRecordsService
      .createRecord({
        patient_id: event.patientId,
        doctor_id: this.doctorId as number,
        diagnosis: event.diagnosis,
        treatment: event.treatment,
        notes: event.notes
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (record) => {
          this.records.update((items) =>
            [...items, record].sort(
              (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            )
          );
          this.isSavingRecord.set(false);
          this.recordsMessage.set('Registro creado con éxito.');
        },
        error: () => {
          this.isSavingRecord.set(false);
          this.recordsError.set('No pudimos crear el registro. Revisá los datos e intentá nuevamente.');
        }
      });
  }

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
      return false;
    }
    return true;
  }
}
