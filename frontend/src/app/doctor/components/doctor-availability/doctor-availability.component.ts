import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
  signal
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';

import { AvailabilityDto, AppointmentBlockDto } from '../../../core/models/appointment';
import { AvailabilityCalendarComponent } from '../availability-calendar/availability-calendar.component';

export interface DoctorAvailabilityCreateEvent {
  startAt: string;
  endAt: string;
}

export interface TimeSlotTemplate {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  description: string;
}

export interface DoctorAvailabilityUpdateEvent {
  id: number;
}

@Component({
  selector: 'app-doctor-availability',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgClass, DatePipe, AvailabilityCalendarComponent],
  templateUrl: './doctor-availability.component.html',
  styleUrl: './doctor-availability.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DoctorAvailabilityComponent {
  @Input() availability: AvailabilityDto[] = [];
  @Input() loading = false;
  @Input() createPending = false;
  @Input() mutationId: number | null = null;
  @Input() error: string | null = null;
  @Input() message: string | null = null;
  @Input() doctorName: string | null = null;

  @Output() refresh = new EventEmitter<void>();
  @Output() create = new EventEmitter<DoctorAvailabilityCreateEvent>();
  @Output() update = new EventEmitter<DoctorAvailabilityUpdateEvent>();

  private readonly fb = inject(FormBuilder);

  readonly formError = signal<string | null>(null);
  readonly viewMode = signal<'list' | 'calendar'>('calendar');
  readonly form = this.fb.nonNullable.group({
    date: ['', Validators.required],
    template: ['', Validators.required],
    start: ['', Validators.required],
    end: ['', Validators.required]
  });

  readonly timeSlotTemplates: TimeSlotTemplate[] = [
    {
      id: 'morning',
      name: 'Mañana',
      startTime: '09:00',
      endTime: '12:00',
      description: '9:00 - 12:00 (3 horas)'
    },
    {
      id: 'afternoon',
      name: 'Tarde',
      startTime: '14:00',
      endTime: '18:00',
      description: '14:00 - 18:00 (4 horas)'
    },
    {
      id: 'fullday',
      name: 'Día completo',
      startTime: '09:00',
      endTime: '18:00',
      description: '9:00 - 18:00 (9 horas)'
    },
    {
      id: 'custom',
      name: 'Personalizado',
      startTime: '',
      endTime: '',
      description: 'Define tus propios horarios'
    }
  ];

  readonly hasAvailability = computed(() => this.availability.length > 0);
  
  readonly currentSelectionConflict = computed(() => {
    const formValue = this.form.getRawValue();
    if (!formValue.date || !formValue.start || !formValue.end) {
      return null;
    }
    
    try {
      const selectedDate = new Date(formValue.date);
      const [startHours, startMinutes] = formValue.start.split(':');
      const [endHours, endMinutes] = formValue.end.split(':');
      
      const startDate = new Date(selectedDate);
      startDate.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);
      
      const endDate = new Date(selectedDate);
      endDate.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
      
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return null;
      }
      
      return this.checkForOverlap(startDate, endDate);
    } catch {
      return null;
    }
  });
  
  readonly totalBlocks = computed(() => {
    return this.availability.reduce((total, avail) => total + avail.blocks.length, 0);
  });
  
  readonly availableBlocks = computed(() => {
    return this.availability.reduce((total, avail) => 
      total + avail.blocks.filter(block => !block.isBooked).length, 0
    );
  });
  
  readonly bookedBlocks = computed(() => {
    return this.availability.reduce((total, avail) => 
      total + avail.blocks.filter(block => block.isBooked).length, 0
    );
  });

  constructor() {
    this.initializeDefaultRange();
    this.setupTemplateWatcher();
  }

  private setupTemplateWatcher(): void {
    this.form.get('template')?.valueChanges.subscribe(templateId => {
      if (templateId && templateId !== 'custom') {
        const template = this.timeSlotTemplates.find(t => t.id === templateId);
        if (template) {
          const today = new Date().toISOString().split('T')[0];
          this.form.patchValue({
            date: today,
            start: template.startTime,
            end: template.endTime
          });
          
          // Clear any existing form errors when template changes
          this.formError.set(null);
        }
      }
    });
  }

  submit(): void {
    if (this.createPending) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError.set('Completá los campos requeridos.');
      return;
    }

    const { date, start, end } = this.form.getRawValue();
    
    // Create proper datetime by combining date with time
    const selectedDate = new Date(date);
    const [startHours, startMinutes] = start.split(':');
    const [endHours, endMinutes] = end.split(':');
    
    const startDate = new Date(selectedDate);
    startDate.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);
    
    const endDate = new Date(selectedDate);
    endDate.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      this.formError.set('Ingresá fechas válidas.');
      return;
    }

    if (endDate <= startDate) {
      this.formError.set('La hora de fin debe ser posterior a la de inicio.');
      return;
    }

    // Validate block alignment (start time must be on the hour)
    if (startDate.getMinutes() !== 0) {
      this.formError.set('El horario de inicio debe ser en punto (ej: 9:00, 10:00, 11:00).');
      return;
    }

    // Validate duration is multiple of 30 minutes
    const durationMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
    if (durationMinutes % 30 !== 0) {
      this.formError.set('La duración debe ser múltiplo de 30 minutos.');
      return;
    }

    // Check for overlapping availability
    const overlap = this.checkForOverlap(startDate, endDate);
    if (overlap) {
      this.formError.set('Ya tenés disponibilidad en este horario. Elegí otro horario o fecha.');
      return;
    }

    this.formError.set(null);
    this.create.emit({
      startAt: startDate.toISOString(),
      endAt: endDate.toISOString()
    });
  }


  trackByAvailability = (_: number, item: AvailabilityDto) => item.id;
  trackByBlock = (_: number, item: AppointmentBlockDto) => item.id;

  private checkForOverlap(startDate: Date, endDate: Date): boolean {
    return this.availability.some(slot => {
      const slotStart = new Date(slot.startAt);
      const slotEnd = new Date(slot.endAt);
      
      // Check if the new availability overlaps with existing one
      return startDate < slotEnd && endDate > slotStart;
    });
  }

  getBlocksCount(slot: AvailabilityDto): number {
    return slot.blocks?.length || 0;
  }

  getAvailableBlocksCount(slot: AvailabilityDto): number {
    return slot.blocks?.filter(block => block && !block.isBooked).length || 0;
  }

  resetForm(): void {
    this.form.reset();
    this.formError.set(null);
    this.initializeDefaultRange();
  }

  getSelectedTemplate(): TimeSlotTemplate | null {
    const templateId = this.form.get('template')?.value;
    return templateId ? this.timeSlotTemplates.find(t => t.id === templateId) || null : null;
  }

  isCustomTemplate(): boolean {
    return this.form.get('template')?.value === 'custom';
  }

  setViewMode(mode: 'list' | 'calendar'): void {
    this.viewMode.set(mode);
  }

  onDaySelected(date: Date): void {
    // Handle day selection if needed
    console.log('Day selected:', date);
  }

  onAvailabilitySelected(availability: AvailabilityDto): void {
    // Handle availability selection if needed
    console.log('Availability selected:', availability);
  }

  private initializeDefaultRange(): void {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const startTime = new Date(now.getTime() + 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

    this.form.setValue({
      date: today,
      template: '',
      start: this.formatTime(startTime),
      end: this.formatTime(endTime)
    });
    this.formError.set(null);
  }

  private formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private toLocalInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
