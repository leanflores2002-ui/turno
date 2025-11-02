import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { PatientAppointmentsComponent } from './patient-appointments.component';
import { AppointmentDto } from '../../../core/models/appointment';

describe('PatientAppointmentsComponent', () => {
  let fixture: ComponentFixture<PatientAppointmentsComponent>;
  let component: PatientAppointmentsComponent;

  const appointment: AppointmentDto = {
    id: 12,
    doctor_id: 5,
    patient_id: 1,
    startAt: '2025-10-18T14:00:00Z',
    endAt: '2025-10-18T14:30:00Z',
    status: 'pending',
    notes: null
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientAppointmentsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PatientAppointmentsComponent);
    component = fixture.componentInstance;
  });

  it('should show a placeholder message when there are no appointments', () => {
    fixture.detectChanges();

    const placeholder = fixture.debugElement.query(By.css('.patient-appointments__placeholder'));
    expect(placeholder.nativeElement.textContent.trim()).toContain('Todavía no tenés turnos agendados');
  });

  it('should emit events when confirm and cancel buttons are clicked', () => {
    const confirmSpy = jasmine.createSpy('confirm');
    const cancelSpy = jasmine.createSpy('cancel');
    component.confirm.subscribe(confirmSpy);
    component.cancel.subscribe(cancelSpy);

    fixture.componentRef.setInput('appointments', [appointment]);
    fixture.detectChanges();

    const buttons = fixture.debugElement.queryAll(By.css('.patient-appointments__actions button'));
    expect(buttons.length).toBe(2);

    buttons[0].nativeElement.click();
    buttons[1].nativeElement.click();

    expect(confirmSpy).toHaveBeenCalledWith(12);
    expect(cancelSpy).toHaveBeenCalledWith(12);
  });

  it('should disable actions for canceled appointments', () => {
    const canceledAppointment = { ...appointment, id: 15, status: 'canceled' as const };
    fixture.componentRef.setInput('appointments', [canceledAppointment]);
    fixture.detectChanges();

    const buttons = fixture.debugElement.queryAll(By.css('.patient-appointments__actions button'));
    expect(buttons[0].nativeElement.disabled).toBeTrue();
    expect(buttons[1].nativeElement.disabled).toBeTrue();
  });
});
