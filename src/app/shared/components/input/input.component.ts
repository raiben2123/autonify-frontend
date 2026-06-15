import { Component, input, output, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'search' | 'date' | 'time';

@Component({
    selector: 'app-input',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './input.component.html',
})
export class InputComponent {
    value = model<string>('');
    type = input<InputType>('text');
    placeholder = input<string>('');
    label = input<string>('');
    hint = input<string>('');       // texto de ayuda debajo
    error = input<string>('');       // mensaje de error
    required = input<boolean>(false);
    disabled = input<boolean>(false);
    readonly = input<boolean>(false);
    prefixIcon = input<string>('');
    suffixIcon = input<string>('');
    prefixText = input<string>('');
    suffixText = input<string>('');
    changed = output<string>();
    blurred = output<void>();
    entered = output<void>();  // Enter pulsado

    get inputClasses(): string {
        const base = 'w-full bg-surface text-text text-sm rounded-lg border transition-colors duration-150 placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed';
        const padding = this.prefixIcon() || this.prefixText() ? 'pl-9 pr-3 py-2' : 'px-3 py-2';
        const paddingRight = this.suffixIcon() || this.suffixText() ? 'pr-9' : '';
        const borderColor = this.error()
            ? 'border-danger focus:border-danger focus:ring-danger/50'
            : 'border-border-2 focus:border-primary';

        return [base, padding, paddingRight, borderColor].join(' ');
    }

    onInput(event: Event): void {
        const val = (event.target as HTMLInputElement).value;
        this.value.set(val);
        this.changed.emit(val);
    }
}