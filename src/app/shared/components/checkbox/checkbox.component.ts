import { Component, input, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-checkbox',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './checkbox.component.html',
})
export class CheckboxComponent {
    checked = model<boolean>(false);
    label = input<string>('');
    hint = input<string>('');
    disabled = input<boolean>(false);

    changed = output<boolean>();

    toggle(): void {
        if (this.disabled()) return;
        this.checked.set(!this.checked());
        this.changed.emit(this.checked());
    }
}