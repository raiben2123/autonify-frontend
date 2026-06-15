import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileTabComponent } from './tabs/profile/profile-tab.component';
import { SecurityTabComponent } from './tabs/security/security-tab.component';
import { PreferencesTabComponent } from './tabs/preferences/preferences-tab.component';
import { TeamTabComponent } from './tabs/team/team-tab.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ProfileTabComponent,
    SecurityTabComponent,
    PreferencesTabComponent,
    TeamTabComponent,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent implements OnInit, OnDestroy {
  readonly sections = [
    { fragment: 'perfil',       label: 'Perfil' },
    { fragment: 'seguridad',    label: 'Seguridad' },
    { fragment: 'preferencias', label: 'Preferencias' },
    { fragment: 'equipo',       label: 'Usuarios' },
  ];

  activeSection = signal('perfil');

  ngOnInit(): void {
    setTimeout(() => this.initObserver(), 100);
  }

  scrollTo(fragment: string): void {
    const el = document.getElementById(fragment);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.activeSection.set(fragment);
    }
  }

  ngOnDestroy(): void {
    if (this._scrollHandler && this._scrollContainer) {
      this._scrollContainer.removeEventListener('scroll', this._scrollHandler);
    }
  }

  private initObserver(): void {
    const scrollContainer = document.querySelector('main') as HTMLElement | null;
    if (!scrollContainer) return;

    const onScroll = () => {
      const containerTop = scrollContainer.getBoundingClientRect().top;
      const offset = containerTop + 80; // 80px de margen desde el tope del main
      let current = this.sections[0].fragment;

      for (const s of this.sections) {
        const el = document.getElementById(s.fragment);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= offset) {
          current = s.fragment;
        }
      }

      this.activeSection.set(current);
    };

    scrollContainer.addEventListener('scroll', onScroll, { passive: true });
    this._scrollContainer = scrollContainer;
    this._scrollHandler = onScroll;
    onScroll();
  }

  private _scrollHandler?: () => void;
  private _scrollContainer?: HTMLElement;
}
