import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from './permission.service';

export const roleGuard = (module: string): CanActivateFn => () => {
  const permissions = inject(PermissionService);
  const router = inject(Router);

  if (permissions.canAccess(module)) return true;
  router.navigate([permissions.homeRoute()]);
  return false;
};
