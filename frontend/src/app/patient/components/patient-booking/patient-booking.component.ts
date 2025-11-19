import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DatePipe, AsyncPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DoctorsService } from '../../../core/services/doctors.service';
import { AppointmentsService } from '../../../core/services/appointments.service';
import { DoctorDto } from '../../../core/models/user';
import { AppointmentCreateRequest, AppointmentDto, AvailabilityDto, AppointmentBlockDto } from '../../../core/models/appointment';

interface AppointmentSlot {
  id: string;
  startAt: Date;
  endAt: Date;
  availabilityId: number;
  blockId?: number;
}

@Component({
  selector: 'app-patient-booking',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
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

  readonly selectionForm = this.fb.group({
    doctorId: ['']
  });

  readonly doctors = signal<DoctorDto[]>([]);
  readonly availability = signal<AvailabilityDto[]>([]);
  readonly availableBlocks = signal<AppointmentBlockDto[]>([]);
  readonly appointmentSlots = signal<AppointmentSlot[]>([]);
  readonly isLoadingDoctors = signal<boolean>(false);
  readonly isLoadingAvailability = signal<boolean>(false);
  readonly isLoadingBlocks = signal<boolean>(false);
  readonly isBooking = signal<boolean>(false);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  readonly selectedDoctor = computed(() => {
    const id = this.selectionForm.controls.doctorId.value;
    if (!id || id === '') return null;
    const doctorId = parseInt(id, 10);
    return this.doctors().find((doctor) => doctor.id === doctorId) ?? null;
  });

  constructor() {
    this.selectionForm.controls.doctorId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        if (id && id !== '') {
          const doctorId = parseInt(id, 10);
          if (doctorId > 0) {
            this.loadAvailability(doctorId);
          }
        }
      });
    this.loadDoctors();
  }

  bookBlock(block: AppointmentBlockDto): void {
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
      start_at: new Date(block.startAt).toISOString(),
      end_at: new Date(block.endAt).toISOString()
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
          this.loadAvailableBlocks(doctor.id);
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
          this.loadAvailableBlocks(doctorId);
        },
        error: () => {
          this.error.set('No pudimos cargar la disponibilidad de este profesional.');
          this.isLoadingAvailability.set(false);
        }
      });
  }

  private loadAvailableBlocks(doctorId: number): void {
    this.isLoadingBlocks.set(true);
    
    // Get blocks for the next 30 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    
    this.appointmentsService
      .getAvailableBlocks(
        doctorId,
        startDate.toISOString(),
        endDate.toISOString()
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blocks) => {
          this.availableBlocks.set(blocks);
          this.isLoadingBlocks.set(false);
        },
        error: () => {
          this.isLoadingBlocks.set(false);
          console.error('Error loading available blocks');
        }
      });
  }
}
