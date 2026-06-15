import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PermissionService } from '../../core/auth/permission.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ButtonComponent, InputComponent, RouterLink],
    templateUrl: './login.component.html',
})
export class LoginComponent {
    private auth        = inject(AuthService);
    private router      = inject(Router);
    private permissions = inject(PermissionService);

    email = signal('');
    password = signal('');
    loading = signal(false);
    error = signal('');

    onSubmit(): void {
        if (!this.email() || !this.password()) {
            this.error.set('Introduce tu email y contraseña');
            return;
        }

        this.loading.set(true);
        this.error.set('');

        this.auth.login({ email: this.email(), password: this.password() }).subscribe({
            next: () => this.router.navigate([this.permissions.homeRoute()]),
            error: () => {
                this.error.set('Email o contraseña incorrectos');
                this.loading.set(false);
            },
        });
    }
}