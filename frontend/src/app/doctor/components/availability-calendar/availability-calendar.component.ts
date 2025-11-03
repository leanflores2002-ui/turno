import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AvailabilityDto } from '../../../core/models/appointment';

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  availability: AvailabilityDto[];
}

@Component({
  selector: 'app-availability-calendar',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './availability-calendar.component.html',
  styleUrl: './availability-calendar.component.scss'
})
export class AvailabilityCalendarComponent {
  @Input() availability: AvailabilityDto[] = [];
  @Input() loading = false;
  @Output() daySelected = new EventEmitter<Date>();
  @Output() availabilitySelected = new EventEmitter<AvailabilityDto>();

  readonly currentDate = signal(new Date());
  readonly selectedDate = signal<Date | null>(null);

  readonly currentMonth = computed(() => this.currentDate().getMonth());
  readonly currentYear = computed(() => this.currentDate().getFullYear());
  readonly monthName = computed(() => this.currentDate().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }));

  readonly calendarDays = computed(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const today = new Date();
    
    // Get first day of month and calculate starting date of calendar
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const currentDate = new Date(startDate);
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = currentDate.toDateString() === today.toDateString();
      
      // Find availability for this day
      const dayAvailability = this.availability.filter(avail => {
        const availDate = new Date(avail.startAt);
        return availDate.toDateString() === currentDate.toDateString();
      });
      
      days.push({
        date: new Date(currentDate),
        isCurrentMonth,
        isToday,
        availability: dayAvailability
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  });

  readonly groupedAvailability = computed(() => {
    const groups: { [key: string]: AvailabilityDto[] } = {};
    
    this.availability.forEach(avail => {
      const date = new Date(avail.startAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(avail);
    });
    
    return groups;
  });

  previousMonth(): void {
    const newDate = new Date(this.currentDate());
    newDate.setMonth(newDate.getMonth() - 1);
    this.currentDate.set(newDate);
  }

  nextMonth(): void {
    const newDate = new Date(this.currentDate());
    newDate.setMonth(newDate.getMonth() + 1);
    this.currentDate.set(newDate);
  }

  goToToday(): void {
    this.currentDate.set(new Date());
  }

  selectDay(day: CalendarDay): void {
    this.selectedDate.set(day.date);
    this.daySelected.emit(day.date);
  }

  selectAvailability(availability: AvailabilityDto): void {
    this.availabilitySelected.emit(availability);
  }

  getTotalBlocksForDay(day: CalendarDay): number {
    return day.availability.reduce((total, avail) => total + (avail.blocks?.length || 0), 0);
  }

  getAvailableBlocksForDay(day: CalendarDay): number {
    return day.availability.reduce((total, avail) => {
      return total + (avail.blocks?.filter(block => !block.isBooked).length || 0);
    }, 0);
  }

  getBookedBlocksForDay(day: CalendarDay): number {
    return day.availability.reduce((total, avail) => {
      return total + (avail.blocks?.filter(block => block.isBooked).length || 0);
    }, 0);
  }

  isDaySelected(day: CalendarDay): boolean {
    return this.selectedDate()?.toDateString() === day.date.toDateString();
  }

  getDayAvailabilitySummary(day: CalendarDay): string {
    const total = this.getTotalBlocksForDay(day);
    const available = this.getAvailableBlocksForDay(day);
    const booked = this.getBookedBlocksForDay(day);
    
    if (total === 0) return '';
    return `${available}/${total} disponibles`;
  }
}
