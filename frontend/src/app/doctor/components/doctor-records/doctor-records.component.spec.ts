import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorRecordsComponent } from './doctor-records.component';
import { MedicalRecordDto } from '../../../core/models/medical-record';

describe('DoctorRecordsComponent', () => {
  let fixture: ComponentFixture<DoctorRecordsComponent>;
  let component: DoctorRecordsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorRecordsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DoctorRecordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should emit create record event with normalized fields', () => {
    const createSpy = jasmine.createSpy('createRecord');
    component.createRecord.subscribe(createSpy);

    component.createForm.setValue({
      patientId: 15,
      diagnosis: '  Control anual ',
      treatment: '',
      notes: '  Recordar estudios  '
    });

    component.submitCreate();

    expect(createSpy).toHaveBeenCalled();
    const payload = createSpy.calls.mostRecent().args[0];
    expect(payload.patientId).toBe(15);
    expect(payload.diagnosis).toBe('Control anual');
    expect(payload.treatment).toBeNull();
    expect(payload.notes).toBe('Recordar estudios');
  });

  it('should block submission when patient id is invalid', () => {
    const createSpy = jasmine.createSpy('createRecord');
    component.createRecord.subscribe(createSpy);

    component.createForm.setValue({
      patientId: 0,
      diagnosis: '',
      treatment: '',
      notes: ''
    });

    component.submitCreate();

    expect(createSpy).not.toHaveBeenCalled();
    expect(component.createFormError()).toContain('Indicá el paciente');
  });

  it('should emit update event when editing a record', () => {
    const updateSpy = jasmine.createSpy('updateRecord');
    component.updateRecord.subscribe(updateSpy);

    const record: MedicalRecordDto = {
      id: 9,
      patient_id: 3,
      doctor_id: 2,
      diagnosis: 'Chequeo',
      treatment: null,
      notes: null,
      created_at: '2025-10-10T10:00:00Z',
      updated_at: '2025-10-10T10:00:00Z'
    };

    component.startEdit(record);
    component.editForm.setValue({
      diagnosis: 'Chequeo actualizado',
      treatment: '',
      notes: ''
    });

    component.submitEdit();

    expect(updateSpy).toHaveBeenCalledWith({
      recordId: 9,
      changes: {
        diagnosis: 'Chequeo actualizado',
        treatment: null,
        notes: null
      }
    });
  });

  it('should require at least one field when updating', () => {
    const updateSpy = jasmine.createSpy('updateRecord');
    component.updateRecord.subscribe(updateSpy);

    const record: MedicalRecordDto = {
      id: 12,
      patient_id: 4,
      doctor_id: 2,
      diagnosis: null,
      treatment: null,
      notes: null,
      created_at: '2025-10-10T10:00:00Z',
      updated_at: '2025-10-10T10:00:00Z'
    };

    component.startEdit(record);
    component.editForm.setValue({
      diagnosis: '',
      treatment: '',
      notes: ''
    });

    component.submitEdit();

    expect(updateSpy).not.toHaveBeenCalled();
    expect(component.editFormError()).toContain('al menos un dato');
  });
});
