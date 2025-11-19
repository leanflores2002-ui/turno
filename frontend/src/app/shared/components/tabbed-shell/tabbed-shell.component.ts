import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface TabConfig {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-tabbed-shell',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatButtonModule, MatIconModule],
  template: `
    <section class="tabbed-shell">
      <header class="tabbed-shell__header">
        <div class="tabbed-shell__title">
          <h2>{{ title }}</h2>
          <p>{{ subtitle }}</p>
        </div>
        <div class="tabbed-shell__actions">
          <ng-content select="[slot=actions]"></ng-content>
        </div>
      </header>

      @if (errorMessage) {
        <div class="tabbed-shell__error">
          {{ errorMessage }}
        </div>
      }

      <mat-tab-group 
        [(selectedIndex)]="selectedTabIndex"
        (selectedIndexChange)="onTabChange($event)"
        class="tabbed-shell__tabs"
        [dynamicHeight]="true">
        @for (tab of tabs; track tab.id) {
          <mat-tab [disabled]="tab.disabled">
            <ng-template mat-tab-label>
              @if (tab.icon) {
                <mat-icon>{{ tab.icon }}</mat-icon>
              }
              {{ tab.label }}
            </ng-template>
            <div class="tabbed-shell__content">
              @if (tab.id === 'profile') {
                <ng-content select="[slot=profile]"></ng-content>
              }
              @if (tab.id === 'appointments') {
                <ng-content select="[slot=appointments]"></ng-content>
              }
              @if (tab.id === 'booking') {
                <ng-content select="[slot=booking]"></ng-content>
              }
              @if (tab.id === 'records') {
                <ng-content select="[slot=records]"></ng-content>
              }
              @if (tab.id === 'dashboard') {
                <ng-content select="[slot=dashboard]"></ng-content>
              }
              @if (tab.id === 'availability') {
                <ng-content select="[slot=availability]"></ng-content>
              }
              @if (tab.id === 'users') {
                <ng-content select="[slot=users]"></ng-content>
              }
              @if (tab.id === 'doctors') {
                <ng-content select="[slot=doctors]"></ng-content>
              }
              @if (tab.id === 'settings') {
                <ng-content select="[slot=settings]"></ng-content>
              }
            </div>
          </mat-tab>
        }
      </mat-tab-group>
    </section>
  `,
  styleUrl: './tabbed-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabbedShellComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() tabs: TabConfig[] = [];
  @Input() errorMessage: string | null = null;
  @Input() selectedTabIndex: number = 0;

  @Output() tabChange = new EventEmitter<number>();

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    this.tabChange.emit(index);
  }
}
