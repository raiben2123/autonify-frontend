import { Component, input, output, model } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-textarea',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './textarea.component.html',
})
export class TextareaComponent {
    value = model<string>('');
    label = input<string>('');
    placeholder = input<string>('');
    hint = input<string>('');
    error = input<string>('');
    required = input<boolean>(false);
    disabled = input<boolean>(false);
    rows = input<number>(4);
    maxlength = input<number | null>(null);

    changed = output<string>();
    blurred = output<void>();

    get classes(): string {
        const base = 'w-full bg-surface text-text text-sm rounded-lg border transition-colors duration-150 px-3 py-2 placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed resize-none';
        const border = this.error()
            ? 'border-danger focus:border-danger focus:ring-danger/50'
            : 'border-border-2 focus:border-primary';
        return [base, border].join(' ');
    }

    onInput(event: Event): void {
        const val = (event.target as HTMLTextAreaElement).value;
        this.value.set(val);
        this.changed.emit(val);
    }
}