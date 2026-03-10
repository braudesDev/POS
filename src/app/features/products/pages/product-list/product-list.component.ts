import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductsService } from '../../services/products.service';
import { Producto } from '../../models/producto.model';
import { MaterialModule } from '../../../../shared/material/material.module';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, MatProgressSpinner],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
})
export class ProductListComponent implements OnInit {
  private productsService = inject(ProductsService);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  productos: Producto[] = [];
  loading = true;
  error: string | null = null;

  // Define las columnas que se mostrarán
  displayedColumns: string[] = [
    'imagen',
    'codigo',
    'nombre',
    'categoria',
    'precio',
    'stock',
    'acciones',
  ];

  ngOnInit() {
    this.cargarProductos();
  }

  cargarProductos() {
    this.loading = true;
    this.error = null;

    this.productsService.getProductos().subscribe({
      next: (productos) => {
        this.productos = productos;
        this.loading = false;
        this.cdr.detectChanges();
        console.log('Productos cargados:', this.productos);
      },
      error: (err) => {
        console.error('Error cargando productos:', err);
        this.error =
          'Error al cargar los productos. Verifica la conexión con Firebase.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  eliminarProducto(producto: Producto) {
    const dialogData: ConfirmDialogData = {
      titulo: 'Eliminar Producto',
      mensaje: `¿Estás seguro de que deseas eliminar "${producto.nombre}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      color: 'warn',
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: dialogData,
      width: '400px',
      disableClose: true,
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.productsService.eliminarProducto(producto.id!).subscribe({
          next: () => {
            this.snackBar.open(
              '✅ Producto eliminado correctamente',
              'Cerrar',
              {
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'top',
                panelClass: ['success-snackbar'],
              },
            );
            this.cargarProductos();
          },
          error: (err) => {
            console.error('Error eliminando producto:', err);
            this.snackBar.open('❌ Error al eliminar el producto', 'Cerrar', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['error-snackbar'],
            });
          },
        });
      }
    });
  }
}
