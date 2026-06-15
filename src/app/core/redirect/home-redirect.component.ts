import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PermissionService } from '../auth/permission.service';

/**
 * Componente vacío que redirige al homeRoute() del rol actual.
 * Evita hardcodear '/' → '/dashboard' cuando MEMBER no puede verlo.
 */
@Component({
  standalone: true,
  template: '',
})
export class HomeRedirectComponent implements OnInit {
  private router = inject(Router);
  private permissions = inject(PermissionService);

  ngOnInit(): void {
    this.router.navigate([this.permissions.homeRoute()], { replaceUrl: true });
  }
}
