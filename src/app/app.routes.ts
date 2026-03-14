import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard'; // importamos el guard de autenticación

export const routes: Routes = [
  // Ruta pública: Login (sin guard)
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },

  // Rutas protegidas (requieren autenticación)
  {
    path: 'productos',
    canActivate: [authGuard], // ← PROTEGIDO
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/products/pages/product-list/product-list.component').then(
            (m) => m.ProductListComponent,
          ),
      },
      {
        path: 'nuevo',
        loadComponent: () =>
          import('./features/products/pages/product-form/product-form.component').then(
            (m) => m.ProductFormComponent,
          ),
      },
      {
        path: 'editar/:id',
        loadComponent: () =>
          import('./features/products/pages/product-form/product-form.component').then(
            (m) => m.ProductFormComponent,
          ),
      },
    ],
  },

  // POS protegido
  {
    path: 'pos',
    canActivate: [authGuard], // ← PROTEGIDO
    loadComponent: () =>
      import('./features/sales/pages/pos/pos.component').then(
        (m) => m.PosComponent,
      ),
  },

  // Reportes protegidos
  {
    path: 'reportes',
    canActivate: [authGuard], // ← PROTEGIDO
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/reports/pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'historial',
        loadComponent: () =>
          import('./features/reports/pages/sales-history/sales-history.component').then(
            (m) => m.SalesHistoryComponent,
          ),
      },
    ],
  },

  // Redirección por defecto: a login
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },

  // Ruta comodín (opcional) - para 404
  {
    path: '**',
    redirectTo: '/login',
  },
];
