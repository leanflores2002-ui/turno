import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { PatientDto, PatientUpdateRequest } from '../../../core/models/user';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './patient-profile.component.html',
  styleUrl: './patient-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientProfileComponent implements OnChanges {
  @Input() patient: PatientDto | null = null;
  @Input() loading = false;
  @Input() saving = false;
  @Output() save = new EventEmitter<PatientUpdateRequest>();

  private readonly fb = new FormBuilder();

  readonly form = this.fb.group({
    full_name: [''],
    email: ['', [Validators.required, Validators.email]],
    medical_record_number: [''],
    emergency_contact: ['']
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patient'] && this.patient) {
      this.form.patchValue(
        {
          full_name: this.patient.full_name ?? '',
          email: this.patient.email ?? '',
          medical_record_number: this.patient.medical_record_number ?? '',
          emergency_contact: this.patient.emergency_contact ?? ''
        },
        { emitEvent: false }
      );
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.save.emit({
      full_name: raw.full_name ?? null,
      email: raw.email ?? null,
      medical_record_number: raw.medical_record_number ?? null,
      emergency_contact: raw.emergency_contact ?? null
    });
  }
}
