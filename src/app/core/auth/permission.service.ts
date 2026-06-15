import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

export type AppRole = 'OWNER' | 'ADMIN' | 'MEMBER';

/**
 * Qué módulos puede ver cada rol del sistema.
 * Los roles custom heredan los permisos de MEMBER por defecto
 * hasta que implementemos permisos granulares en frontend.
 */
const ROLE_ACCESS: Record<AppRole, string[]> = {
  OWNER: [
    'inicio', 'clients', 'projects', 'tasks', 'time',
    'invoices', 'quotes', 'expenses', 'suppliers', 'catalog',
    'fiscal', 'ajustes',
  ],
  ADMIN: [
    'inicio', 'clients', 'projects', 'tasks', 'time',
    'invoices', 'quotes', 'expenses', 'suppliers', 'catalog',
    'ajustes',
  ],
  MEMBER: [
    'tasks', 'time',
  ],
};

/**
 * Ruta de inicio según rol.
 * MEMBER no tiene acceso a /inicio (haría llamadas que devuelven 403),
 * va directamente a /tareas que sí puede ver.
 */
const HOME_ROUTE: Record<AppRole, string> = {
  OWNER:  '/inicio',
  ADMIN:  '/inicio',
  MEMBER: '/tareas',
};

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private auth = inject(AuthService);

  private get role(): AppRole {
    const r = this.auth.userRole() as AppRole;
    return ROLE_ACCESS[r] ? r : 'MEMBER';
  }

  canAccess(module: string): boolean {
    return ROLE_ACCESS[this.role]?.includes(module) ?? false;
  }

  /** Ruta a la que redirigir tras login o cuando no tiene permiso */
  homeRoute(): string {
    return HOME_ROUTE[this.role] ?? '/tareas';
  }

  get isOwner()  { return this.role === 'OWNER'; }
  get isAdmin()  { return this.role === 'OWNER' || this.role === 'ADMIN'; }
  get isMember() { return this.role === 'MEMBER'; }
}
