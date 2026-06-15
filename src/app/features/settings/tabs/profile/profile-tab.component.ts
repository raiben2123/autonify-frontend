import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../settings.service';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
    selector: 'app-profile-tab',
    standalone: true,
    imports: [CommonModule, FormsModule, InputComponent, ButtonComponent],
    templateUrl: './profile-tab.component.html',
    styleUrl: './profile-tab.component.css',
})
export class ProfileTabComponent implements OnInit {
    private svc = inject(SettingsService);

    loading = signal(true);
    saving = signal(false);
    success = signal(false);

    firstName = signal('');
    lastName = signal('');
    phone = signal('');
    jobTitle = signal('');
    email = signal('');

    ngOnInit(): void {
        this.svc.getProfile().subscribe({
            next: p => {
                this.firstName.set(p.firstName ?? '');
                this.lastName.set(p.lastName ?? '');
                this.phone.set(p.phone ?? '');
                this.jobTitle.set(p.jobTitle ?? '');
                this.email.set(p.email);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    save(): void {
        this.saving.set(true);
        this.success.set(false);
        this.svc.updateProfile({
            firstName: this.firstName(),
            lastName: this.lastName(),
            phone: this.phone(),
            jobTitle: this.jobTitle(),
        }).subscribe({
            next: () => { this.saving.set(false); this.success.set(true); setTimeout(() => this.success.set(false), 3000); },
            error: () => this.saving.set(false),
        });
    }
}