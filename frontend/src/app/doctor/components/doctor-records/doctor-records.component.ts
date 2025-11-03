import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal
} from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';

import { PatientDto } from '../../../core/models/user';
import { MedicalRecordDto, MedicalRecordUpdateRequest } from '../../../core/models/medical-record';
import { DoctorPatientsListComponent, PatientSelectedEvent } from '../doctor-patients-list/doctor-patients-list.component';
import { PatientMedicalModalComponent, PatientMedicalModalCloseEvent } from '../patient-medical-modal/patient-medical-modal.component';

export interface DoctorRecordUpdateEvent {
  recordId: number;
  changes: MedicalRecordUpdateRequest;
}

@Component({
  selector: 'app-doctor-records',
  standalone: true,
  imports: [DoctorPatientsListComponent, PatientMedicalModalComponent],
  templateUrl: './doctor-records.component.html',
  styleUrl: './doctor-records.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DoctorRecordsComponent {
  @Input() patients: PatientDto[] = [];
  @Input() records: MedicalRecordDto[] = [];
  @Input() loadingPatients = false;
  @Input() loadingRecords = false;
  @Input() saving = false;
  @Input() mutationId: number | null = null;
  @Input() error: string | null = null;
  @Input() message: string | null = null;
  @Input() doctorId: number | null = null;

  @Output() refresh = new EventEmitter<void>();
  @Output() updateRecord = new EventEmitter<DoctorRecordUpdateEvent>();

  readonly selectedPatient = signal<PatientDto | null>(null);
  readonly showModal = signal<boolean>(false);

  get hasRecords(): boolean {
    return this.records.length > 0;
  }

  onPatientSelected(event: PatientSelectedEvent): void {
    this.selectedPatient.set(event.patient);
    this.showModal.set(true);
  }

  onModalClose(event: PatientMedicalModalCloseEvent): void {
    this.showModal.set(false);
    this.selectedPatient.set(null);
    
    if (event.type === 'recordCreated') {
      this.refresh.emit();
    }
  }

  trackByRecord = (_: number, item: MedicalRecordDto) => item.id;
}
