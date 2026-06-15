import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
    selector: 'app-button',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './button.component.html',
})
export class ButtonComponent {
    variant = input<ButtonVariant>('primary');
    size = input<ButtonSize>('md');
    label = input<string>('');
    icon = input<string>('');        // nombre del icono SVG (lo añadimos luego)
    iconPos = input<'left' | 'right'>('left');
    disabled = input<boolean>(false);
    loading = input<boolean>(false);
    fullWidth = input<boolean>(false);
    type = input<'button' | 'submit' | 'reset'>('button');

    clicked = output<void>();

    get classes(): string {
        const base = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-app-bg disabled:opacity-50 disabled:cursor-not-allowed';

        const variants: Record<ButtonVariant, string> = {
            primary: 'bg-primary text-white hover:bg-primary-hover focus:ring-primary shadow-glow',
            secondary: 'bg-surface-2 text-text border border-border-2 hover:border-primary hover:text-primary',
            ghost: 'text-text-2 hover:text-text hover:bg-surface-2',
            danger: 'bg-danger/10 text-danger border border-danger/30 hover:bg-danger hover:text-white',
            success: 'bg-accent/10 text-accent border border-accent/30 hover:bg-accent hover:text-white',
        };

        const sizes: Record<ButtonSize, string> = {
            sm: 'text-xs px-3 py-1.5 rounded-md',
            md: 'text-sm px-4 py-2 rounded-lg',
            lg: 'text-base px-6 py-2.5 rounded-lg',
        };

        const width = this.fullWidth() ? 'w-full' : '';

        return [base, variants[this.variant()], sizes[this.size()], width].join(' ');
    }
}