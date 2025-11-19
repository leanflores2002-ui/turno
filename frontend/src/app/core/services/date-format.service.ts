import { Injectable } from '@angular/core';
import { DatePipe } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class DateFormatService {
  constructor(private datePipe: DatePipe) {}

  /**
   * Format date to DD/MM/YY format
   */
  formatShortDate(date: string | Date): string {
    return this.datePipe.transform(date, 'dd/MM/yy') || '';
  }

  /**
   * Format date to DD/MM/YYYY format
   */
  formatLongDate(date: string | Date): string {
    return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
  }

  /**
   * Format date to DD/MM/YYYY HH:mm format
   */
  formatDateTime(date: string | Date): string {
    return this.datePipe.transform(date, 'dd/MM/yyyy HH:mm') || '';
  }

  /**
   * Format date to DD/MM/YYYY HH:mm:ss format
   */
  formatFullDateTime(date: string | Date): string {
    return this.datePipe.transform(date, 'dd/MM/yyyy HH:mm:ss') || '';
  }

  /**
   * Format date to EEEE d MMMM format (e.g., "lunes 15 octubre")
   */
  formatDayMonth(date: string | Date): string {
    return this.datePipe.transform(date, 'EEEE d MMMM', 'es-ES') || '';
  }

  /**
   * Format date to short format (e.g., "15/10/25")
   */
  formatShort(date: string | Date): string {
    return this.datePipe.transform(date, 'dd/MM/yy') || '';
  }

  /**
   * Format time to HH:mm format
   */
  formatTime(date: string | Date): string {
    return this.datePipe.transform(date, 'HH:mm') || '';
  }
}
