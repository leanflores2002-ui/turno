import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
  signal
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';

import { AvailabilityDto } from '../../../core/models/appointment';

export interface DoctorAvailabilityCreateEvent {
  startAt: string;
  endAt: string;
  slots: number;
}

export interface DoctorAvailabilityUpdateEvent {
  id: number;
  slots: number;
}

@Component({
  selector: 'app-doctor-availability',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor, NgClass, DatePipe],
  templateUrl: './doctor-availability.component.html',
  styleUrl: './doctor-availability.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DoctorAvailabilityComponent {
  @Input() availability: AvailabilityDto[] = [];
  @Input() loading = false;
  @Input() createPending = false;
  @Input() mutationId: number | null = null;
  @Input() error: string | null = null;
  @Input() message: string | null = null;
  @Input() doctorName: string | null = null;

  @Output() refresh = new EventEmitter<void>();
  @Output() create = new EventEmitter<DoctorAvailabilityCreateEvent>();
  @Output() update = new EventEmitter<DoctorAvailabilityUpdateEvent>();

  private readonly fb = inject(FormBuilder);

  readonly formError = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({
    start: ['', Validators.required],
    end: ['', Validators.required],
    slots: [1, [Validators.required, Validators.min(1), Validators.max(4)]]
  });

  readonly hasAvailability = computed(() => this.availability.length > 0);

  constructor() {
    this.initializeDefaultRange();
  }

  submit(): void {
    if (this.createPending) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError.set('Completá los campos requeridos.');
      return;
    }

    const { start, end, slots } = this.form.getRawValue();
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      this.formError.set('Ingresá fechas válidas.');
      return;
    }

    if (endDate <= startDate) {
      this.formError.set('La hora de fin debe ser posterior a la de inicio.');
      return;
    }

    this.formError.set(null);
    this.create.emit({
      startAt: startDate.toISOString(),
      endAt: endDate.toISOString(),
      slots
    });
  }

  adjustSlots(slot: AvailabilityDto, delta: number): void {
    if (this.mutationId === slot.id) {
      return;
    }
    const next = Math.max(1, Math.min(4, slot.slots + delta));
    if (next === slot.slots) {
      return;
    }
    this.update.emit({ id: slot.id, slots: next });
  }

  trackByAvailability = (_: number, item: AvailabilityDto) => item.id;

  resetForm(): void {
    this.initializeDefaultRange();
  }

  private initializeDefaultRange(): void {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const startDate = new Date(now.getTime() + 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

    this.form.setValue({
      start: this.toLocalInputValue(startDate),
      end: this.toLocalInputValue(endDate),
      slots: 1
    });
    this.formError.set(null);
  }

  private toLocalInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
