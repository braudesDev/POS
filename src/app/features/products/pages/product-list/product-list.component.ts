import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductsService } from '../../services/products.service';
import { Producto } from '../../models/producto.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
})
export class ProductListComponent implements OnInit {
  private productsService = inject(ProductsService);

  productos: Producto[] = [];
  loading = true;
  error: string | null = null;

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
        console.log('Productos cargados:', productos);
      },
      error: (err) => {
        console.error('Error cargando productos:', err);
        this.error =
          'Error al cargar los productos. Verifica la conexión con Firebase.';
        this.loading = false;
      },
    });
  }

  eliminarProducto(producto: Producto) {
    if (confirm(`¿Eliminar "${producto.nombre}"?`)) {
      this.productsService.eliminarProducto(producto.id!).subscribe({
        next: () => {
          this.cargarProductos(); // Recargar la lista
        },
        error: (err) => {
          console.error('Error eliminando producto:', err);
          alert('Error al eliminar el producto');
        },
      });
    }
  }
}
