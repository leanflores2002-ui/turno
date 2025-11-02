import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DatePipe, NgClass } from '@angular/common';

import { AppointmentDto, AppointmentStatus } from '../../../core/models/appointment';

@Component({
  selector: 'app-patient-appointments',
  standalone: true,
  imports: [CommonModule, DatePipe, NgClass],
  templateUrl: './patient-appointments.component.html',
  styleUrl: './patient-appointments.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientAppointmentsComponent {
  @Input() appointments: ReadonlyArray<AppointmentDto> = [];
  @Input() loading = false;
  @Input() actionId: number | null = null;
  @Output() cancel = new EventEmitter<number>();
  @Output() confirm = new EventEmitter<number>();

  protected readonly statusLabels: Record<AppointmentStatus, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    canceled: 'Cancelado',
    completed: 'Completado'
  };

  onCancel(id: number): void {
    this.cancel.emit(id);
  }

  onConfirm(id: number): void {
    this.confirm.emit(id);
  }

  isActionDisabled(id: number, status: AppointmentStatus): boolean {
    if (status === 'canceled' || status === 'completed') {
      return true;
    }
    return this.actionId === id;
  }
}
