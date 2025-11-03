import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

import { MedicalRecordDto } from '../../../core/models/medical-record';

@Component({
  selector: 'app-patient-medical-records',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './patient-medical-records.component.html',
  styleUrl: './patient-medical-records.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientMedicalRecordsComponent {
  @Input() records: ReadonlyArray<MedicalRecordDto> = [];
  @Input() loading = false;
  @Input() error: string | null = null;
  @Output() refresh = new EventEmitter<void>();

  trackRecordById(_: number, item: MedicalRecordDto): number {
    return item.id;
  }
}
