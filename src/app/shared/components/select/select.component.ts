import { Component, input, output, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

@Component({
    selector: 'app-select',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './select.component.html',
})
export class SelectComponent {    value = model<string>('');
    options = input.required<SelectOption[]>();    label = input<string>('');
    placeholder = input<string>('Selecciona una opción');
    hint = input<string>('');
    error = input<string>('');
    required = input<boolean>(false);    disabled = input<boolean>(false);    changed = output<string>();

    get selectClasses(): string {
        const base = 'w-full bg-surface text-text text-sm rounded-lg border transition-colors duration-150 px-3 py-2 pr-9 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed';
        const borderColor = this.error()
            ? 'border-danger focus:border-danger focus:ring-danger/50'
            : 'border-border-2 focus:border-primary';

        return [base, borderColor].join(' ');
    }

    onChange(event: Event): void {
        const val = (event.target as HTMLSelectElement).value;
        this.value.set(val);
        this.changed.emit(val);
    }
}