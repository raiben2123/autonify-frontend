import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-empty-state',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './empty-state.component.html',
})
export class EmptyStateComponent {
    title = input.required<string>();
    subtitle = input<string>('');
    icon = input<string>(''); // SVG inline
}