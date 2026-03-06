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
  {
    path: '',
    redirectTo: '/productos',
    pathMatch: 'full',
  },
];
