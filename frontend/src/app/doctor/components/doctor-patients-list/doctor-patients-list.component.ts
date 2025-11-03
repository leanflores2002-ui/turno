import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  inject,
  signal
} from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { DatePipe } from '@angular/common';

import { PatientDto } from '../../../core/models/user';

export interface PatientSelectedEvent {
  patient: PatientDto;
}

@Component({
  selector: 'app-doctor-patients-list',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './doctor-patients-list.component.html',
  styleUrl: './doctor-patients-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DoctorPatientsListComponent implements OnChanges {
  @Input() patients: PatientDto[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;

  @Output() patientSelected = new EventEmitter<PatientSelectedEvent>();

  readonly searchQuery = signal<string>('');
  readonly filteredPatients = signal<PatientDto[]>([]);

  constructor() {
    // Initialize filtered patients with all patients
    this.filteredPatients.set(this.patients);
  }

  ngOnChanges(): void {
    this.updateFilteredPatients();
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.updateFilteredPatients();
  }

  onPatientClick(patient: PatientDto): void {
    this.patientSelected.emit({ patient });
  }

  trackByPatientId = (_: number, patient: PatientDto) => patient.id;

  private updateFilteredPatients(): void {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) {
      this.filteredPatients.set(this.patients);
      return;
    }

    const filtered = this.patients.filter(patient => 
      patient.full_name?.toLowerCase().includes(query) ||
      patient.id.toString().includes(query) ||
      patient.medical_record_number?.toLowerCase().includes(query)
    );
    this.filteredPatients.set(filtered);
  }
}
