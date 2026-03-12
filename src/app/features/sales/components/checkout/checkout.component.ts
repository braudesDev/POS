import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/material/material.module'; // ← IMPORTAR MATERIAL
import { CarritoService, ItemCarrito } from '../../services/carrito.service';
import {
  Firestore,
  collection,
  addDoc,
  Timestamp,
} from '@angular/fire/firestore';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    MatButtonToggleModule,
    MatSnackBarModule,
  ],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
})
export class CheckoutComponent {
  private carritoService = inject(CarritoService);
  private firestore = inject(Firestore);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  items: ItemCarrito[] = [];
  total = this.carritoService.getTotal();

  metodoPago: MetodoPago = 'efectivo';
  montoPago = 0;
  nota = '';
  procesando = false;
  mensaje = '';
  mensajeExito = false;

  constructor() {
    this.carritoService.carrito$.subscribe((items) => {
      this.items = items;
      this.total = this.carritoService.getTotal();
      this.montoPago = this.total;
    });
  }

  puedeProcesar(): boolean {
    if (this.items.length === 0) return false;
    if (this.metodoPago === 'efectivo') {
      return this.montoPago >= this.total;
    }
    return true;
  }

  cancelar() {
    if (this.items.length > 0) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        data: {
          titulo: 'Cancelar Venta',
          mensaje:
            '¿Estás seguro de cancelar esta venta? Se perderán los productos del carrito.',
          confirmText: 'Sí, cancelar',
          cancelText: 'No, seguir',
          color: 'warn',
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.carritoService.limpiarCarrito();
          this.router.navigate(['/pos']);
        }
      });
    } else {
      this.router.navigate(['/pos']);
    }
  }

  async procesarVenta() {
    if (!this.puedeProcesar()) return;

    this.procesando = true;
    this.mensaje = '';

    try {
      const venta = {
        fecha: Timestamp.now(),
        items: this.items.map((item) => ({
          productoId: item.producto.id,
          nombre: item.producto.nombre,
          cantidad: item.cantidad,
          precio: item.producto.precio,
          subtotal: item.subtotal,
        })),
        total: this.total,
        metodoPago: this.metodoPago,
        montoPago: this.metodoPago === 'efectivo' ? this.montoPago : this.total,
        cambio:
          this.metodoPago === 'efectivo' ? this.montoPago - this.total : 0,
        nota: this.nota || '',
        createdAt: Timestamp.now(),
      };

      const ventasRef = collection(this.firestore, 'ventas');
      await addDoc(ventasRef, venta);

      this.mensaje = 'Venta completada exitosamente';
      this.mensajeExito = true;
      this.carritoService.limpiarCarrito();

      setTimeout(() => {
        this.router.navigate(['/pos']);
      }, 2000);
    } catch (error) {
      console.error('Error al procesar venta:', error);
      this.mensaje = 'Error al procesar la venta';
      this.mensajeExito = false;
      this.procesando = false;
    }
  }
}
