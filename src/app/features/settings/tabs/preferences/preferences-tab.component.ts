import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../settings.service';
import { ThemeService } from '../../../../core/theme/theme.service';
import { UserPreferences } from '../../../../core/models/user.model';
import { SelectComponent } from '../../../../shared/components/select/select.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
    selector: 'app-preferences-tab',
    standalone: true,
    imports: [CommonModule, SelectComponent, ButtonComponent],
    templateUrl: './preferences-tab.component.html',
    styleUrl: './preferences-tab.component.css',
})
export class PreferencesTabComponent implements OnInit {
    private svc = inject(SettingsService);
    private themeService = inject(ThemeService);

    loading = signal(true);
    saving = signal(false);
    success = signal(false);

    theme = signal<string>('SYSTEM');
    language = signal<string>('es');
    timezone = signal<string>('Europe/Madrid');
    dateFormat = signal<string>('DD/MM/YYYY');
    timeFormat = signal<string>('24h');
    weekStartsOn = signal<string>('MONDAY');

    readonly themeOptions = [{ value: 'SYSTEM', label: 'Sistema' }, { value: 'LIGHT', label: 'Claro' }, { value: 'DARK', label: 'Oscuro' }];
    readonly languageOptions = [{ value: 'es', label: 'Español' }, { value: 'ca', label: 'Català' }, { value: 'eu', label: 'Euskara' }, { value: 'gl', label: 'Galego' }, { value: 'en', label: 'English' }];
    readonly timezoneOptions = [{ value: 'Europe/Madrid', label: 'Madrid (CET)' }, { value: 'Europe/London', label: 'Londres (GMT)' }, { value: 'America/New_York', label: 'Nueva York (ET)' }];
    readonly dateOptions = [{ value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' }, { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' }, { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }];
    readonly timeOptions = [{ value: '24h', label: '24 horas' }, { value: '12h', label: '12 horas (AM/PM)' }];
    readonly weekOptions = [{ value: 'MONDAY', label: 'Lunes' }, { value: 'SUNDAY', label: 'Domingo' }];

    ngOnInit(): void {
        this.svc.getPreferences().subscribe({
            next: p => {
                this.theme.set(p.theme ?? 'SYSTEM');
                this.language.set(p.language ?? 'es');
                this.timezone.set(p.timezone ?? 'Europe/Madrid');
                this.dateFormat.set(p.dateFormat ?? 'DD/MM/YYYY');
                this.timeFormat.set(p.timeFormat ?? '24h');
                this.weekStartsOn.set(p.weekStartsOn ?? 'MONDAY');
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    save(): void {
        this.saving.set(true);
        this.success.set(false);
        this.svc.updatePreferences({
            theme: this.theme() as UserPreferences['theme'],
            language: this.language(),
            timezone: this.timezone(),
            dateFormat: this.dateFormat(),
            timeFormat: this.timeFormat(),
            weekStartsOn: this.weekStartsOn() as UserPreferences['weekStartsOn'],
        }).subscribe({
            next: () => {
                this.saving.set(false);
                this.success.set(true);
                setTimeout(() => this.success.set(false), 3000);
                this.themeService.apply(this.theme() as any);
            },
            error: () => this.saving.set(false),
        });
    }
}