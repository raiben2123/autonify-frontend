import { Pipe, PipeTransform } from '@angular/core';

const ROLE_LABELS: Record<string, string> = {
    OWNER: 'Propietario',
    ADMIN: 'Administrador',
    MEMBER: 'Miembro',
};

@Pipe({
    name: 'roleLabel',
    standalone: true,
})
export class RoleLabelPipe implements PipeTransform {
    transform(role: string | undefined): string {
        if (!role) return '';
        return ROLE_LABELS[role.toUpperCase()] ?? role;
    }
}