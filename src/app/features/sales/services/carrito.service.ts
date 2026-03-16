import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
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

    // Calcular nueva cantidad total si existe
    const nuevaCantidad = existe ? existe.cantidad + cantidad : cantidad;

    console.log('➕ Intentando agregar:', {
      producto: producto.nombre,
      stock: producto.stock,
      cantidadSolicitada: nuevaCantidad,
    });

    if (nuevaCantidad <= producto.stock) {
      if (existe) {
        existe.cantidad += cantidad;
        existe.subtotal = existe.producto.precio * existe.cantidad;
        console.log('✅ Cantidad actualizada a:', existe.cantidad);
      } else {
        const nuevoItem: ItemCarrito = {
          producto,
          cantidad,
          subtotal: producto.precio * cantidad,
        };
        carritoActual.push(nuevoItem);
        console.log('✅ Nuevo producto agregado');
      }
      this.carritoSubject.next([...carritoActual]);
    } else {
      console.log('❌ Stock insuficiente, no se agrega');
      // Aquí deberías emitir un error o mostrar mensaje
    }
  }

  /**
   * Agregar producto por código de barras
   */
  agregarPorCodigo(
    codigo: string,
  ): Observable<{ success: boolean; message: string; tipo?: string }> {
    return new Observable((observer) => {
      this.productsService.getProductoByCodigo(codigo).subscribe({
        next: (producto) => {
          if (producto) {
            const carritoActual = this.carritoSubject.value;
            const itemEnCarrito = carritoActual.find(
              (item) => item.producto.id === producto.id,
            );
            const cantidadEnCarrito = itemEnCarrito?.cantidad || 0;

            console.log('🔍 Producto encontrado:', producto.nombre);
            console.log('📦 Stock disponible:', producto.stock);
            console.log('🛒 En carrito:', cantidadEnCarrito);

            if (cantidadEnCarrito < producto.stock) {
              this.agregarProducto(producto);
              observer.next({
                success: true,
                message: `✅ ${producto.nombre} agregado (${cantidadEnCarrito + 1}/${producto.stock})`,
                tipo: 'exito',
              });
            } else {
              observer.next({
                success: false,
                message: `❌ ${producto.nombre}: solo hay ${producto.stock} disponible(s). Ya tienes ${cantidadEnCarrito} en el carrito. No tienes suficiente stock para agregar más.`,
                tipo: 'stock_insuficiente',
              });
            }
          } else {
            observer.next({
              success: false,
              message: `❌ Código ${codigo} no encontrado en el catálogo`,
              tipo: 'no_encontrado',
            });
          }
          observer.complete();
        },
        error: (err) => observer.error(err),
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

  verificcarStock(
    productoId: string,
    cantidadSolicitada: number,
  ): Observable<boolean> {
    return this.productsService.getProductoById(productoId).pipe(
      map((producto) => {
        if (!producto) return false;
        return cantidadSolicitada <= producto.stock;
      }),
    );
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
