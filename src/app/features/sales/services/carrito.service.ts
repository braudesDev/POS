import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Producto } from '../../products/models/producto.model';
import { ProductsService } from '../../products/services/products.service';

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  subtotal: number;
}

@Injectable({
  providedIn: 'root',
})
export class CarritoService {
  private productsService = inject(ProductsService);

  private carritoSubject = new BehaviorSubject<ItemCarrito[]>([]);
  carrito$ = this.carritoSubject.asObservable();

  /**
   * Agregar producto al carrito
   */
  agregarProducto(producto: Producto, cantidad: number = 1) {
    const carritoActual = this.carritoSubject.value;
    const existe = carritoActual.find(
      (item) => item.producto.id === producto.id,
    );

    if (existe) {
      existe.cantidad += cantidad;
      existe.subtotal = existe.producto.precio * existe.cantidad;
      this.carritoSubject.next([...carritoActual]);
    } else {
      const nuevoItem: ItemCarrito = {
        producto,
        cantidad,
        subtotal: producto.precio * cantidad,
      };
      this.carritoSubject.next([...carritoActual, nuevoItem]);
    }
  }

  /**
   * Agregar producto por código de barras
   */
  agregarPorCodigo(codigo: string): Observable<boolean> {
    return new Observable((observer) => {
      this.productsService.getProductoByCodigo(codigo).subscribe({
        next: (producto) => {
          if (producto) {
            this.agregarProducto(producto);
            observer.next(true);
          } else {
            observer.next(false);
          }
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
        },
      });
    });
  }

  /**
   * Eliminar producto del carrito
   */
  eliminarDelCarrito(productoId: string) {
    const carritoActual = this.carritoSubject.value;
    const nuevoCarrito = carritoActual.filter(
      (item) => item.producto.id !== productoId,
    );
    this.carritoSubject.next(nuevoCarrito);
  }

  /**
   * Actualizar cantidad de un producto
   */
  actualizarCantidad(productoId: string, cantidad: number) {
    const carritoActual = this.carritoSubject.value;
    const item = carritoActual.find((item) => item.producto.id === productoId);

    if (item && cantidad > 0) {
      item.cantidad = cantidad;
      item.subtotal = item.producto.precio * cantidad;
      this.carritoSubject.next([...carritoActual]);
    }
  }

  /**
   * Limpiar carrito
   */
  limpiarCarrito() {
    this.carritoSubject.next([]);
  }

  /**
   * Obtener total del carrito
   */
  getTotal(): number {
    return this.carritoSubject.value.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );
  }

  /**
   * Obtener cantidad total de items
   */
  getTotalItems(): number {
    return this.carritoSubject.value.reduce(
      (sum, item) => sum + item.cantidad,
      0,
    );
  }
}
