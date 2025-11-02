import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { PatientMedicalRecordsComponent } from './patient-medical-records.component';
import { MedicalRecordDto } from '../../../core/models/medical-record';

describe('PatientMedicalRecordsComponent', () => {
  let fixture: ComponentFixture<PatientMedicalRecordsComponent>;
  let component: PatientMedicalRecordsComponent;

  const records: MedicalRecordDto[] = [
    {
      id: 1,
      patient_id: 2,
      doctor_id: 3,
      diagnosis: 'Hipertensión',
      treatment: 'Plan alimentario',
      notes: 'Control mensual',
      created_at: '2025-10-10T10:00:00Z',
      updated_at: '2025-10-12T12:00:00Z'
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientMedicalRecordsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PatientMedicalRecordsComponent);
    component = fixture.componentInstance;
  });

  it('should render a placeholder when there are no records', () => {
    fixture.detectChanges();

    const placeholder = fixture.debugElement.query(By.css('.patient-records__placeholder'));
    expect(placeholder.nativeElement.textContent).toContain('Aún no registramos antecedentes médicos');
  });

  it('should display records when provided', () => {
    fixture.componentRef.setInput('records', records);
    fixture.detectChanges();

    const title = fixture.debugElement.query(By.css('.patient-records__item h4'));
    expect(title.nativeElement.textContent).toContain('Hipertensión');
  });

  it('should emit refresh when update button is clicked', () => {
    const refreshSpy = jasmine.createSpy('refresh');
    component.refresh.subscribe(refreshSpy);

    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button.btn'));
    button.nativeElement.click();

    expect(refreshSpy).toHaveBeenCalled();
  });
});
