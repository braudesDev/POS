import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarritoService } from '../../services/carrito.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MaterialModule } from '../../../../shared/material/material.module';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MaterialModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
})
export class CartComponent {
  carritoService = inject(CarritoService);
  totalItems = 0;

  constructor() {
    this.carritoService.carrito$.subscribe((items) => {
      this.totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);
      console.log('Total items actualizado:', this.totalItems); // ← Agrega esto
    });
  }

  aumentarCantidad(item: any) {
    this.carritoService.actualizarCantidad(
      item.producto.id!,
      item.cantidad + 1,
    );
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
    if (confirm('¿Vaciar el carrito?')) {
      this.carritoService.limpiarCarrito();
    }
  }
}
