import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  signal,
  DestroyRef
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MedicalRecordsService } from '../../../core/services/medical-records.service';
import { MedicalRecordDto, MedicalRecordCreateRequest } from '../../../core/models/medical-record';

export interface PatientMedicalModalCloseEvent {
  type: 'close' | 'recordCreated';
  record?: MedicalRecordDto;
}

@Component({
  selector: 'app-patient-medical-modal',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './patient-medical-modal.component.html',
  styleUrl: './patient-medical-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientMedicalModalComponent implements OnInit {
  @Input() patientId!: number;
  @Input() patientName!: string;
  @Input() doctorId!: number;

  @Output() modalClose = new EventEmitter<PatientMedicalModalCloseEvent>();

  private readonly medicalRecordsService = inject(MedicalRecordsService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly activeTab = signal<'history' | 'new'>('history');
  readonly patientHistory = signal<MedicalRecordDto[]>([]);
  readonly loadingHistory = signal<boolean>(false);
  readonly savingRecord = signal<boolean>(false);
  readonly historyError = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);

  readonly newRecordForm = this.fb.nonNullable.group({
    diagnosis: [''],
    treatment: [''],
    notes: ['']
  });

  ngOnInit(): void {
    this.loadPatientHistory();
  }

  onTabChange(tab: 'history' | 'new'): void {
    this.activeTab.set(tab);
    this.saveError.set(null);
  }

  onClose(): void {
    this.modalClose.emit({ type: 'close' });
  }

  onSubmitNewRecord(): void {
    if (this.savingRecord()) {
      return;
    }

    if (this.newRecordForm.invalid) {
      this.newRecordForm.markAllAsTouched();
      this.saveError.set('Completá al menos un campo para crear el registro.');
      return;
    }

    const { diagnosis, treatment, notes } = this.newRecordForm.getRawValue();
    this.savingRecord.set(true);
    this.saveError.set(null);

    const payload: MedicalRecordCreateRequest = {
      patient_id: this.patientId,
      doctor_id: this.doctorId,
      diagnosis: this.normalizeOptional(diagnosis),
      treatment: this.normalizeOptional(treatment),
      notes: this.normalizeOptional(notes)
    };

    this.medicalRecordsService
      .createRecord(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (record) => {
          this.savingRecord.set(false);
          this.newRecordForm.reset();
          this.loadPatientHistory(); // Refresh history
          this.modalClose.emit({ type: 'recordCreated', record });
        },
        error: () => {
          this.savingRecord.set(false);
          this.saveError.set('No pudimos crear el registro. Reintentá más tarde.');
        }
      });
  }

  trackByRecordId = (_: number, record: MedicalRecordDto) => record.id;

  private loadPatientHistory(): void {
    this.loadingHistory.set(true);
    this.historyError.set(null);

    this.medicalRecordsService
      .getPatientHistory(this.patientId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (records) => {
          this.patientHistory.set(records);
          this.loadingHistory.set(false);
        },
        error: () => {
          this.loadingHistory.set(false);
          this.historyError.set('No pudimos cargar el historial del paciente.');
        }
      });
  }

  private normalizeOptional(value: string | null | undefined): string | null {
    const normalized = (value ?? '').trim();
    return normalized.length ? normalized : null;
  }
}
