import { Pipe, PipeTransform, inject } from '@angular/core';
import { NavGroup } from '../../layout/sidebar/sidebar.model';
import { PermissionService } from '../../core/auth/permission.service';

/**
 * Filtra los items de un NavGroup según los permisos del usuario.
 * Devuelve true si el grupo tiene al menos un item visible,
 * lo que permite ocultar grupos enteros vacíos en el sidebar.
 *
 * Uso en template:
 *   @if (group.items | visibleItems) { ... }
 */
@Pipe({
  name: 'visibleItems',
  standalone: true,
})
export class VisibleItemsPipe implements PipeTransform {
  private permissions = inject(PermissionService);

  transform(items: NavGroup['items']): boolean {
    return items.some(item => this.permissions.canAccess(item.module));
  }
}
