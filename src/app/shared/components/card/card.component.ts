import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './card.component.html',
})
export class CardComponent {
    title = input<string>('');
    subtitle = input<string>('');
    padding = input<'none' | 'sm' | 'md' | 'lg'>('md');
    hoverable = input<boolean>(false);

    get classes(): string {
        const base = 'bg-surface rounded-xl border border-border transition-all duration-150';
        const hover = this.hoverable() ? 'hover:border-border-2 hover:shadow-md cursor-pointer' : '';
        const pad: Record<string, string> = {
            none: '',
            sm: 'p-4',
            md: 'p-6',
            lg: 'p-8',
        };
        return [base, hover].join(' ');
    }

    get bodyPadding(): string {
        const pad: Record<string, string> = {
            none: '',
            sm: 'p-4',
            md: 'p-6',
            lg: 'p-8',
        };
        return pad[this.padding()];
    }
}