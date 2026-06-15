import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-spinner',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="flex items-center justify-center" [class]="wrapperClass()">
      <span
        class="border-2 border-current border-t-transparent rounded-full animate-spin text-primary"
        [class]="sizeClass()">
      </span>
    </div>
  `,
})
export class SpinnerComponent {
    size = input<'sm' | 'md' | 'lg'>('md');
    fullPage = input<boolean>(false);

    sizeClass(): string {
        return { sm: 'size-4', md: 'size-6', lg: 'size-10' }[this.size()];
    }

    wrapperClass(): string {
        return this.fullPage() ? 'fixed inset-0 bg-app-bg/80 z-50' : 'py-8';
    }
}