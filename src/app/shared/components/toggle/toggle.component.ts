import { Component, input, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-toggle',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './toggle.component.html',
})
export class ToggleComponent {
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