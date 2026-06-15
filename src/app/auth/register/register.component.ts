import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { environment } from '../../../environments/environment';

interface RegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    tenantName: string;
    nif: string;
}

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [ButtonComponent, InputComponent, RouterLink],
    templateUrl: './register.component.html',
})
export class RegisterComponent {
    private http = inject(HttpClient);
    private router = inject(Router);

    firstName = signal('');
    lastName = signal('');
    email = signal('');
    password = signal('');
    tenantName = signal('');
    nif = signal('');

    loading = signal(false);
    error = signal('');

    onSubmit(): void {
        if (!this.firstName() || !this.lastName() || !this.email() || !this.password() || !this.tenantName()) {
            this.error.set('Rellena todos los campos obligatorios');
            return;
        }

        this.loading.set(true);
        this.error.set('');

        const body: RegisterRequest = {
            firstName: this.firstName(),
            lastName: this.lastName(),
            email: this.email(),
            password: this.password(),
            tenantName: this.tenantName(),
            nif: this.nif(),
        };

        this.http.post(`${environment.apiUrl}/auth/register`, body).subscribe({
            next: () => this.router.navigate(['/auth/login']),
            error: (err) => {
                this.error.set(err.error?.message ?? 'Error al crear la cuenta. Inténtalo de nuevo.');
                this.loading.set(false);
            },
        });
    }
}