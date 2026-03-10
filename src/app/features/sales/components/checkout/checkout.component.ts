import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CarritoService, ItemCarrito } from '../../services/carrito.service';
import {
  Firestore,
  collection,
  addDoc,
  Timestamp,
} from '@angular/fire/firestore';

export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
})
export class CheckoutComponent {
  private carritoService = inject(CarritoService);
  private firestore = inject(Firestore);
  private router = inject(Router);

  items: ItemCarrito[] = [];
  total = this.carritoService.getTotal();

  metodoPago: MetodoPago = 'efectivo';
  montoPago = 0;
  nota = '';
  procesando = false;
  mensaje = '';
  mensajeExito = false;

  constructor() {
    // Suscribirse a cambios en el carrito
    this.carritoService.carrito$.subscribe((items) => {
      this.items = items;
      this.total = this.carritoService.getTotal();
      this.montoPago = this.total; // Por defecto, monto igual al total
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
    this.router.navigate(['/pos']);
  }

  async procesarVenta() {
    if (!this.puedeProcesar()) return;

    this.procesando = true;
    this.mensaje = '';

    try {
      // Preparar datos de la venta
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

      console.log('Guardando venta:', venta);

      // Guardar en Firebase
      const ventasRef = collection(this.firestore, 'ventas');
      await addDoc(ventasRef, venta);

      // Éxito
      this.mensaje = '✅ Venta completada exitosamente';
      this.mensajeExito = true;

      // Limpiar carrito
      this.carritoService.limpiarCarrito();

      // Redirigir después de 2 segundos
      setTimeout(() => {
        this.router.navigate(['/pos']);
      }, 2000);
    } catch (error) {
      console.error('Error al procesar venta:', error);
      this.mensaje = '❌ Error al procesar la venta';
      this.mensajeExito = false;
      this.procesando = false;
    }
  }
}
