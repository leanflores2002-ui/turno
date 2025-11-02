import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { PatientBookingComponent } from './patient-booking.component';
import { DoctorsService } from '../../../core/services/doctors.service';
import { AppointmentsService } from '../../../core/services/appointments.service';
import { AvailabilityDto } from '../../../core/models/appointment';

describe('PatientBookingComponent', () => {
  let fixture: ComponentFixture<PatientBookingComponent>;
  let component: PatientBookingComponent;
  let doctorsService: jasmine.SpyObj<DoctorsService>;
  let appointmentsService: jasmine.SpyObj<AppointmentsService>;

  const availability: AvailabilityDto = {
    id: 10,
    doctor_id: 2,
    startAt: '2025-10-20T12:00:00Z',
    endAt: '2025-10-20T12:30:00Z',
    slots: 1
  };

  beforeEach(async () => {
    doctorsService = jasmine.createSpyObj<DoctorsService>('DoctorsService', ['listDoctors']);
    appointmentsService = jasmine.createSpyObj<AppointmentsService>(
      'AppointmentsService',
      ['listDoctorAvailability', 'book']
    );

    doctorsService.listDoctors.and.returnValue(
      of([
        {
          id: 2,
          email: 'doctor@example.com',
          password: '***',
          is_active: true,
          is_superuser: false,
          full_name: 'Doctor Demo',
          specialty: 'Clínica',
          license_number: 'MN1234',
          years_experience: 10
        }
      ])
    );

    appointmentsService.listDoctorAvailability.and.returnValue(of([availability]));
    appointmentsService.book.and.returnValue(
      of({
        id: 999,
        doctor_id: 2,
        patient_id: 5,
        startAt: availability.startAt,
        endAt: availability.endAt,
        status: 'pending',
        notes: null
      })
    );

    await TestBed.configureTestingModule({
      imports: [PatientBookingComponent],
      providers: [
        { provide: DoctorsService, useValue: doctorsService },
        { provide: AppointmentsService, useValue: appointmentsService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PatientBookingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load doctors and availability on init', () => {
    expect(doctorsService.listDoctors).toHaveBeenCalled();
    expect(appointmentsService.listDoctorAvailability).toHaveBeenCalledWith(2);
    expect(component.availability().length).toBeGreaterThan(0);
  });

  it('should book a slot and emit the resulting appointment', () => {
    const bookedSpy = jasmine.createSpy('booked');
    component.booked.subscribe(bookedSpy);
    component.patientId = 5;

    component.bookSlot(availability);

    expect(appointmentsService.book).toHaveBeenCalled();
    expect(bookedSpy).toHaveBeenCalled();
  });

  it('should surface errors when booking fails', () => {
    component.patientId = 5;
    appointmentsService.book.and.returnValue(throwError(() => new Error('fail')));

    component.bookSlot(availability);

    expect(component.error()).toContain('No pudimos reservar');
  });
});
