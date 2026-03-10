import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'productos',
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
  // Ruta para el POS
  {
    path: 'pos',
    loadComponent: () =>
      import('./features/sales/pages/pos/pos.component').then(
        (m) => m.PosComponent,
      ),
  },
  {
    path: 'reportes',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/reports/pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'dashboard',
        redirectTo: '',
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
  // Secambia la direccion al POS
  {
    path: '',
    redirectTo: '/pos',
    pathMatch: 'full',
  },
];
