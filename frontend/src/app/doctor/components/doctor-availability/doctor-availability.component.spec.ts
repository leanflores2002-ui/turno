import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorAvailabilityComponent } from './doctor-availability.component';
import { AvailabilityDto } from '../../../core/models/appointment';

describe('DoctorAvailabilityComponent', () => {
  let fixture: ComponentFixture<DoctorAvailabilityComponent>;
  let component: DoctorAvailabilityComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorAvailabilityComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DoctorAvailabilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should emit create event with normalized ISO dates', () => {
    const createSpy = jasmine.createSpy('create');
    component.create.subscribe(createSpy);

    component.form.setValue({
      start: '2025-06-01T10:00',
      end: '2025-06-01T11:00',
      slots: 2
    });

    component.submit();

    expect(createSpy).toHaveBeenCalled();
    const payload = createSpy.calls.mostRecent().args[0];
    expect(payload.startAt).toBe(new Date('2025-06-01T10:00').toISOString());
    expect(payload.endAt).toBe(new Date('2025-06-01T11:00').toISOString());
    expect(payload.slots).toBe(2);
  });

  it('should surface validation errors when end precedes start', () => {
    const createSpy = jasmine.createSpy('create');
    component.create.subscribe(createSpy);

    component.form.setValue({
      start: '2025-06-01T11:00',
      end: '2025-06-01T10:30',
      slots: 1
    });

    component.submit();

    expect(createSpy).not.toHaveBeenCalled();
    expect(component.formError()).toContain('hora de fin');
  });

  it('should emit update event when adjusting slots within bounds', () => {
    const updateSpy = jasmine.createSpy('update');
    component.update.subscribe(updateSpy);

    const slot: AvailabilityDto = {
      id: 3,
      doctor_id: 2,
      startAt: '2025-06-01T10:00:00Z',
      endAt: '2025-06-01T10:30:00Z',
      slots: 2
    };

    component.adjustSlots(slot, 1);
    expect(updateSpy).toHaveBeenCalledWith({ id: 3, slots: 3 });
  });

  it('should clamp slot adjustments beyond allowed limits', () => {
    const updateSpy = jasmine.createSpy('update');
    component.update.subscribe(updateSpy);

    const slot: AvailabilityDto = {
      id: 5,
      doctor_id: 4,
      startAt: '2025-06-01T10:00:00Z',
      endAt: '2025-06-01T10:30:00Z',
      slots: 4
    };

    component.adjustSlots(slot, 1);
    expect(updateSpy).not.toHaveBeenCalled();
  });
});
