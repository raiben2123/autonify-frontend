import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../settings.service';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
    selector: 'app-security-tab',
    standalone: true,
    imports: [CommonModule, InputComponent, ButtonComponent],
    templateUrl: './security-tab.component.html',
    styleUrl: './security-tab.component.css',
})
export class SecurityTabComponent {
    private svc = inject(SettingsService);

    saving = signal(false);
    success = signal(false);
    error = signal('');

    current = signal('');
    newPass = signal('');
    confirmNew = signal('');

    save(): void {
        this.error.set('');
        if (this.newPass() !== this.confirmNew()) {
            this.error.set('Las contraseñas no coinciden');
            return;
        }
        if (this.newPass().length < 8) {
            this.error.set('La nueva contraseña debe tener al menos 8 caracteres');
            return;
        }
        this.saving.set(true);
        this.svc.changePassword({ currentPassword: this.current(), newPassword: this.newPass() }).subscribe({
            next: () => {
                this.saving.set(false);
                this.success.set(true);
                this.current.set('');
                this.newPass.set('');
                this.confirmNew.set('');
                setTimeout(() => this.success.set(false), 3000);
            },
            error: () => { this.saving.set(false); this.error.set('Contraseña actual incorrecta'); },
        });
    }
}