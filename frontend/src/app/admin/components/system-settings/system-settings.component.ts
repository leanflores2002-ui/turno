import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SystemSettingsService } from '../../../core/services/system-settings.service';
import { BlockDurationConfig } from '../../../core/models/appointment';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './system-settings.component.html',
  styleUrl: './system-settings.component.scss'
})
export class SystemSettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly settingsService = inject(SystemSettingsService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly currentDuration = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    blockDuration: [60, [Validators.required, Validators.min(15), Validators.max(240)]]
  });

  constructor() {
    this.loadCurrentSettings();
  }

  private loadCurrentSettings(): void {
    this.loading.set(true);
    this.error.set(null);

    this.settingsService.getBlockDuration().subscribe({
      next: (config: BlockDurationConfig) => {
        this.currentDuration.set(config.blockDurationMinutes);
        this.form.patchValue({
          blockDuration: config.blockDurationMinutes
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar la configuración actual');
        this.loading.set(false);
        console.error('Error loading settings:', err);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.message.set(null);

    const { blockDuration } = this.form.getRawValue();

    this.settingsService.updateBlockDuration(blockDuration).subscribe({
      next: () => {
        this.currentDuration.set(blockDuration);
        this.message.set('Configuración actualizada exitosamente');
        this.saving.set(false);
        
        // Clear message after 3 seconds
        setTimeout(() => this.message.set(null), 3000);
      },
      error: (err) => {
        this.error.set('Error al actualizar la configuración');
        this.saving.set(false);
        console.error('Error updating settings:', err);
      }
    });
  }

  onReset(): void {
    this.form.patchValue({
      blockDuration: this.currentDuration() || 60
    });
    this.error.set(null);
    this.message.set(null);
  }
}
