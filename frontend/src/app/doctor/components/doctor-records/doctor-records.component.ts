import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf, DatePipe } from '@angular/common';

import {
  MedicalRecordDto,
  MedicalRecordUpdateRequest
} from '../../../core/models/medical-record';

export interface DoctorRecordCreateEvent {
  patientId: number;
  diagnosis: string | null;
  treatment: string | null;
  notes: string | null;
}

export interface DoctorRecordUpdateEvent {
  recordId: number;
  changes: MedicalRecordUpdateRequest;
}

@Component({
  selector: 'app-doctor-records',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf, DatePipe],
  templateUrl: './doctor-records.component.html',
  styleUrl: './doctor-records.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DoctorRecordsComponent {
  @Input() records: MedicalRecordDto[] = [];
  @Input() loading = false;
  @Input() saving = false;
  @Input() mutationId: number | null = null;
  @Input() error: string | null = null;
  @Input() message: string | null = null;

  @Output() refresh = new EventEmitter<void>();
  @Output() createRecord = new EventEmitter<DoctorRecordCreateEvent>();
  @Output() updateRecord = new EventEmitter<DoctorRecordUpdateEvent>();

  private readonly fb = inject(FormBuilder);

  readonly createForm = this.fb.nonNullable.group({
    patientId: [0, [Validators.required, Validators.min(1)]],
    diagnosis: [''],
    treatment: [''],
    notes: ['']
  });

  readonly editForm = this.fb.group({
    diagnosis: [''],
    treatment: [''],
    notes: ['']
  });

  readonly createFormError = signal<string | null>(null);
  readonly editFormError = signal<string | null>(null);
  readonly editingRecordId = signal<number | null>(null);

  get hasRecords(): boolean {
    return this.records.length > 0;
  }

  submitCreate(): void {
    if (this.saving) {
      return;
    }
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      this.createFormError.set('Indicá el paciente destinatario.');
      return;
    }

    const { patientId, diagnosis, treatment, notes } = this.createForm.getRawValue();
    this.createFormError.set(null);
    this.createRecord.emit({
      patientId,
      diagnosis: this.normalizeOptional(diagnosis),
      treatment: this.normalizeOptional(treatment),
      notes: this.normalizeOptional(notes)
    });
  }

  startEdit(record: MedicalRecordDto): void {
    this.editingRecordId.set(record.id);
    this.editForm.setValue({
      diagnosis: record.diagnosis ?? '',
      treatment: record.treatment ?? '',
      notes: record.notes ?? ''
    });
    this.editFormError.set(null);
  }

  cancelEdit(): void {
    this.editingRecordId.set(null);
    this.editForm.reset({ diagnosis: '', treatment: '', notes: '' });
    this.editFormError.set(null);
  }

  submitEdit(): void {
    const recordId = this.editingRecordId();
    if (!recordId) {
      return;
    }

    const { diagnosis, treatment, notes } = this.editForm.getRawValue();
    const changes: MedicalRecordUpdateRequest = {
      diagnosis: this.normalizeOptional(diagnosis),
      treatment: this.normalizeOptional(treatment),
      notes: this.normalizeOptional(notes)
    };

    if (!changes.diagnosis && !changes.treatment && !changes.notes) {
      this.editFormError.set('Ingresá al menos un dato para actualizar.');
      return;
    }

    this.editFormError.set(null);
    this.updateRecord.emit({ recordId, changes });
  }

  trackByRecord = (_: number, item: MedicalRecordDto) => item.id;

  private normalizeOptional(value: string | null | undefined): string | null {
    const normalized = (value ?? '').trim();
    return normalized.length ? normalized : null;
  }
}
