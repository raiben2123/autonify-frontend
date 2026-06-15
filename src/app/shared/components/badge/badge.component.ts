import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.component.html',
})
export class BadgeComponent {
  label   = input.required<string>();
  variant = input<BadgeVariant>('default');
  dot     = input<boolean>(false);  // punto de color a la izquierda

  get classes(): string {
    const base = 'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full';

    const variants: Record<BadgeVariant, string> = {
      default: 'bg-surface-2 text-text-2',
      primary: 'bg-primary/10 text-primary',
      success: 'bg-accent/10 text-accent',
      warning: 'bg-warning/10 text-warning',
      danger:  'bg-danger/10 text-danger',
      info:    'bg-info/10 text-info',
    };

    return [base, variants[this.variant()]].join(' ');
  }

  get dotClasses(): string {
    const dots: Record<BadgeVariant, string> = {
      default: 'bg-text-3',
      primary: 'bg-primary',
      success: 'bg-accent',
      warning: 'bg-warning',
      danger:  'bg-danger',
      info:    'bg-info',
    };
    return `size-1.5 rounded-full ${dots[this.variant()]}`;
  }
}