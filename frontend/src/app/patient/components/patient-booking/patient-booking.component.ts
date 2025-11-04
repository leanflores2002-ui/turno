import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgFor, NgIf, DatePipe, AsyncPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DoctorsService } from '../../../core/services/doctors.service';
import { AppointmentsService } from '../../../core/services/appointments.service';
import { DoctorDto } from '../../../core/models/user';
import { AppointmentCreateRequest, AppointmentDto, AvailabilityDto } from '../../../core/models/appointment';

@Component({
  selector: 'app-patient-booking',
  standalone: true,
  imports: [NgIf, NgFor, ReactiveFormsModule, DatePipe],
  templateUrl: './patient-booking.component.html',
  styleUrl: './patient-booking.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientBookingComponent {
  @Input() patientId: number | null = null;
  @Output() booked = new EventEmitter<AppointmentDto>();

  private readonly doctorsService = inject(DoctorsService);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly fb = new FormBuilder();
  private readonly destroyRef = inject(DestroyRef);

  readonly selectionForm = this.fb.nonNullable.group({
    doctorId: 0
  });

  readonly doctors = signal<DoctorDto[]>([]);
  readonly availability = signal<AvailabilityDto[]>([]);
  readonly isLoadingDoctors = signal<boolean>(false);
  readonly isLoadingAvailability = signal<boolean>(false);
  readonly isBooking = signal<boolean>(false);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  readonly selectedDoctor = computed(() => {
    const id = this.selectionForm.controls.doctorId.value;
    return this.doctors().find((doctor) => doctor.id === id) ?? null;
  });

  constructor() {
    this.selectionForm.controls.doctorId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        if (id) {
          this.loadAvailability(id);
        }
      });
    this.loadDoctors();
  }

  bookSlot(slot: AvailabilityDto): void {
    if (!this.patientId) {
      this.error.set('Necesitamos tu sesión para reservar un turno. Ingresá nuevamente.');
      return;
    }
    const doctor = this.selectedDoctor();
    if (!doctor) {
      this.error.set('Seleccioná un profesional antes de reservar.');
      return;
    }

    this.isBooking.set(true);
    this.error.set(null);
    this.message.set(null);

    const payload: AppointmentCreateRequest = {
      doctor_id: doctor.id,
      patient_id: this.patientId,
      start_at: new Date(slot.startAt).toISOString(),
      end_at: new Date(slot.endAt).toISOString()
    };

    this.appointmentsService
      .book(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (appointment) => {
          this.isBooking.set(false);
          this.message.set('¡Turno reservado con éxito!');
          this.booked.emit(appointment);
          this.loadAvailability(doctor.id);
        },
        error: () => {
          this.isBooking.set(false);
          this.error.set('No pudimos reservar el turno. Intentá nuevamente.');
        }
      });
  }

  private loadDoctors(): void {
    this.isLoadingDoctors.set(true);
    this.doctorsService
      .listDoctors()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (doctors) => {
          this.doctors.set(doctors);
          this.isLoadingDoctors.set(false);
          if (doctors.length) {
            const first = doctors[0].id;
            this.selectionForm.controls.doctorId.setValue(first, { emitEvent: true });
          }
        },
        error: () => {
          this.isLoadingDoctors.set(false);
          this.error.set('No pudimos obtener la lista de profesionales.');
        }
      });
  }

  private loadAvailability(doctorId: number): void {
    this.isLoadingAvailability.set(true);
    this.appointmentsService
      .listDoctorAvailability(doctorId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (slots) => {
          this.availability.set(slots);
          this.isLoadingAvailability.set(false);
        },
        error: () => {
          this.error.set('No pudimos cargar la disponibilidad de este profesional.');
          this.isLoadingAvailability.set(false);
        }
      });
  }
}
