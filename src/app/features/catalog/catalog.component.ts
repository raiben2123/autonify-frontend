import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <div class="catalog-tabs">
      <a routerLink="items" routerLinkActive="active" class="tab-link">Items</a>
      <a routerLink="categorias" routerLinkActive="active" class="tab-link">Categorías</a>
    </div>
    <router-outlet></router-outlet>
  `,
  styles: [`
    .catalog-tabs {
      display: flex;
      gap: 0;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 24px;
    }

    .tab-link {
      padding: 12px 24px;
      text-decoration: none;
      color: #6b7280;
      font-weight: 500;
      transition: all 0.2s;
      cursor: pointer;
    }

    .tab-link:hover {
      color: #374151;
    }

    .tab-link.active {
      color: #3b82f6;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 9px;
    }
  `]
})
export class CatalogComponent {}



