import { Injectable, signal } from '@angular/core';

export type Theme = 'LIGHT' | 'DARK' | 'SYSTEM';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _theme = signal<Theme>('SYSTEM');
  private _mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  readonly theme = this._theme.asReadonly();

  constructor() {
    this._mediaQuery.addEventListener('change', () => {
      if (this._theme() === 'SYSTEM') this.applyToDOM();
    });
  }

  /** Llamar al inicio — lee localStorage para evitar flash de tema incorrecto */
  init(): void {
    const saved = localStorage.getItem('theme') as Theme | null;
    this.apply(saved ?? 'SYSTEM');
  }

  apply(theme: Theme): void {
    this._theme.set(theme);
    localStorage.setItem('theme', theme);
    this.applyToDOM();
  }

  private applyToDOM(): void {
    const isDark =
      this._theme() === 'DARK' ||
      (this._theme() === 'SYSTEM' && this._mediaQuery.matches);
    document.documentElement.classList.toggle('dark', isDark);
  }
}
