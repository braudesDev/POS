import {
  Component,
  inject,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../shared/material/material.module';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog'; // ← IMPORTADO
import { CarritoService, ItemCarrito } from '../../services/carrito.service';
import { ProductsService } from '../../../products/services/products.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, MaterialModule, MatTooltipModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
})
export class CartComponent {
  carritoService = inject(CarritoService);
  private productsService = inject(ProductsService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  totalItems = 0;
  stockDisponible: { [productoId: string]: number } = {};

  constructor() {
    this.carritoService.carrito$.subscribe((items) => {
      this.totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);
      this.verificarStockItems(items);
    });
  }

  private verificarStockItems(items: ItemCarrito[]) {
    items.forEach((item) => {
      this.productsService.getProductoById(item.producto.id!).subscribe({
        next: (producto) => {
          if (producto) {
            this.stockDisponible[item.producto.id!] = producto.stock;
          }
        },
      });
    });
  }

  aumentarCantidad(item: any) {
    const stockActual = this.stockDisponible[item.producto.id!];
    const nuevaCantidad = item.cantidad + 1;

    if (stockActual !== undefined && nuevaCantidad <= stockActual) {
      this.carritoService.actualizarCantidad(item.producto.id!, nuevaCantidad);
    } else {
      this.mostrarAdvertenciaStock(item.producto.nombre, stockActual || 0);
    }
  }

  disminuirCantidad(item: any) {
    if (item.cantidad > 1) {
      this.carritoService.actualizarCantidad(
        item.producto.id!,
        item.cantidad - 1,
      );
    }
  }

  eliminar(productoId: string) {
    this.carritoService.eliminarDelCarrito(productoId);
  }

  limpiarCarrito() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Vaciar Carrito',
        mensaje: '¿Estás seguro de eliminar todos los productos del carrito?',
        confirmText: 'Vaciar',
        cancelText: 'Cancelar',
        color: 'warn',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.carritoService.limpiarCarrito();
        this.snackBar.open('🛒 Carrito vaciado', 'Cerrar', { duration: 2000 });
      }
    });
  }

  private mostrarAdvertenciaStock(nombre: string, stock: number) {
    this.snackBar.open(
      `⚠️ No hay suficiente stock de "${nombre}". Disponible: ${stock}`,
      'Entendido',
      {
        duration: 4000,
        panelClass: ['warning-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top',
      },
    );
  }

  getStockColor(item: any): string {
    const stock = this.stockDisponible[item.producto.id!];
    if (stock === undefined) return '';

    if (item.cantidad >= stock) return 'warn';
    if (item.cantidad >= stock * 0.8) return 'accent';
    return 'primary';
  }
}
