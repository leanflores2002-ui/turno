import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientProfileComponent } from './patient-profile.component';
import { PatientDto } from '../../../core/models/user';

describe('PatientProfileComponent', () => {
  let fixture: ComponentFixture<PatientProfileComponent>;
  let component: PatientProfileComponent;

  const basePatient: PatientDto = {
    id: 1,
    email: 'patient@example.com',
    password: '***',
    is_active: true,
    is_superuser: false,
    full_name: 'Paciente Demo',
    medical_record_number: 'HC-101',
    emergency_contact: 'Contacto'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientProfileComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PatientProfileComponent);
    component = fixture.componentInstance;
  });

  it('should populate the form when a patient is provided', () => {
    fixture.componentRef.setInput('patient', basePatient);
    fixture.detectChanges();

    expect(component.form.value.full_name).toBe('Paciente Demo');
    expect(component.form.value.email).toBe('patient@example.com');
    expect(component.form.value.medical_record_number).toBe('HC-101');
    expect(component.form.value.emergency_contact).toBe('Contacto');
  });

  it('should emit updated values when the form is submitted', () => {
    const saveSpy = jasmine.createSpy('save');
    component.save.subscribe(saveSpy);

    fixture.componentRef.setInput('patient', basePatient);
    fixture.detectChanges();

    component.form.setValue({
      full_name: 'Nuevo Nombre',
      email: 'nuevo@example.com',
      medical_record_number: 'HC-202',
      emergency_contact: 'Nuevo contacto'
    });

    component.onSubmit();

    expect(saveSpy).toHaveBeenCalledWith({
      full_name: 'Nuevo Nombre',
      email: 'nuevo@example.com',
      medical_record_number: 'HC-202',
      emergency_contact: 'Nuevo contacto'
    });
  });

  it('should not emit when the form is invalid', () => {
    const saveSpy = jasmine.createSpy('save');
    component.save.subscribe(saveSpy);

    component.form.setValue({
      full_name: '',
      email: 'invalid-email',
      medical_record_number: '',
      emergency_contact: ''
    });

    component.onSubmit();

    expect(saveSpy).not.toHaveBeenCalled();
    expect(component.form.invalid).toBeTrue();
  });
});
