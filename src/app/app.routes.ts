import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent),
      },
    ],
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./core/redirect/home-redirect.component').then(m => m.HomeRedirectComponent),
        pathMatch: 'full',
      },
      {
        path: 'inicio',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [roleGuard('inicio')],
      },
      {
        path: 'clientes',
        loadComponent: () => import('./features/clients/clients.component').then(m => m.ClientsComponent),
        canActivate: [roleGuard('clients')],
      },
      {
        path: 'catalogo',
        loadComponent: () => import('./features/catalog/catalog.component').then(m => m.CatalogComponent),
        canActivate: [roleGuard('catalog')],
        children: [
          {
            path: 'categorias',
            loadComponent: () => import('./features/catalog/categories/categories.component').then(m => m.CatalogCategoriesComponent),
          },
          {
            path: 'items',
            loadComponent: () => import('./features/catalog/items/items.component').then(m => m.CatalogItemsComponent),
          },
          {
            path: '',
            redirectTo: 'items',
            pathMatch: 'full',
          },
        ],
      },
      {
        path: 'proyectos',
        loadComponent: () => import('./features/projects/projects.component').then(m => m.ProjectsComponent),
        canActivate: [roleGuard('projects')],
      },
      {
        path: 'tareas',
        loadComponent: () => import('./features/tasks/tasks.component').then(m => m.TasksComponent),
        canActivate: [roleGuard('tasks')],
      },
      {
        path: 'tiempo',
        loadComponent: () => import('./features/time/time.component').then(m => m.TimeComponent),
        canActivate: [roleGuard('time')],
      },
      {
        path: 'presupuestos',
        loadComponent: () => import('./features/quotes/quotes.component').then(m => m.QuotesComponent),
        canActivate: [roleGuard('quotes')],
      },
      {
        path: 'ajustes',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
        canActivate: [roleGuard('ajustes')],
      },

    ],
  },
  { path: '**', redirectTo: '' },
];
