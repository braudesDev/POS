import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../../shared/material/material.module';
import { ProductsService } from '../../services/products.service';
import { Producto } from '../../models/producto.model';
import { CarritoService } from '../../../sales/services/carrito.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-product-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, RouterModule],
  templateUrl: './product-viewer.component.html',
  styleUrls: ['./product-viewer.component.css'],
})
export class ProductViewerComponent implements AfterViewInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  private productsService = inject(ProductsService);
  private carritoService = inject(CarritoService);
  private snackBar = inject(MatSnackBar);

  codigoBusqueda: string = '';
  producto: Producto | null = null;
  loading = false;
  error: string | null = null;
  productosSugeridos: Producto[] = [];

  // Variables para el escáner (solo para detectar entrada rápida)
  private scannerBuffer = '';
  private scannerTimeout: any;
  private readonly SCANNER_TIMEOUT = 150;
  private isTyping = false;

  ngAfterViewInit() {
    setTimeout(() => {
      this.searchInput.nativeElement.focus();
    }, 100);
  }

  // Método para buscar mientras escribe (autocompletado)
  buscarPorNombre() {
    const termino = this.codigoBusqueda.trim();

    if (!termino) {
      this.productosSugeridos = [];
      return;
    }

    // Si parece un código de barras (solo números), no mostrar sugerencias
    if (/^\d+$/.test(termino)) {
      this.productosSugeridos = [];
      return;
    }

    const terminoLower = termino.toLowerCase();
    this.productsService.getProductos().subscribe({
      next: (productos) => {
        this.productosSugeridos = productos
          .filter((producto) =>
            producto.nombre.toLowerCase().includes(terminoLower),
          )
          .slice(0, 8); // Máximo 8 sugerencias
      },
      error: () => {
        this.productosSugeridos = [];
      },
    });
  }

  // Seleccionar producto de sugerencias
  seleccionarProducto(producto: Producto) {
    this.producto = producto;
    this.codigoBusqueda = producto.nombre;
    this.productosSugeridos = [];
    this.error = null;
  }

  // Búsqueda manual (al hacer clic en buscar o Enter)
  buscarManual() {
    if (!this.codigoBusqueda.trim()) return;

    const termino = this.codigoBusqueda.trim();

    // Si son solo números, buscar por código
    if (/^\d+$/.test(termino)) {
      this.buscarPorCodigo(termino);
    } else {
      // Si es texto, buscar por nombre
      this.buscarPorNombreExacto(termino);
    }
  }

  // Buscar por código de barras
  private buscarPorCodigo(codigo: string) {
    this.loading = true;
    this.error = null;
    this.producto = null;
    this.productosSugeridos = [];

    this.productsService.getProductoByCodigo(codigo).subscribe({
      next: (producto) => {
        if (producto) {
          this.producto = producto;
          this.codigoBusqueda = producto.nombre;
        } else {
          this.error = 'Producto no encontrado';
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al buscar';
        this.loading = false;
      },
    });
  }

  // Buscar por nombre exacto o similar
  private buscarPorNombreExacto(nombre: string) {
    this.loading = true;
    this.error = null;
    this.producto = null;

    this.productsService.getProductos().subscribe({
      next: (productos) => {
        const encontrado = productos.find(
          (p) => p.nombre.toLowerCase() === nombre.toLowerCase(),
        );

        if (encontrado) {
          this.producto = encontrado;
        } else {
          // Buscar productos que contengan el texto
          const similares = productos.filter((p) =>
            p.nombre.toLowerCase().includes(nombre.toLowerCase()),
          );

          if (similares.length === 1) {
            this.producto = similares[0];
            this.codigoBusqueda = similares[0].nombre;
          } else if (similares.length > 1) {
            this.productosSugeridos = similares.slice(0, 8);
            this.error = `Se encontraron ${similares.length} productos. Selecciona uno de la lista.`;
          } else {
            this.error = 'Producto no encontrado';
          }
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al buscar';
        this.loading = false;
      },
    });
  }

  // Método para detectar entrada del escáner (sin interferir con el input)
  onScannerInput(event: KeyboardEvent) {
    // Solo procesar si NO es una tecla de control
    if (['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) return;

    // Si es Enter, procesar el buffer del escáner
    if (event.key === 'Enter') {
      if (this.scannerBuffer.length > 0) {
        event.preventDefault();
        this.buscarPorCodigo(this.scannerBuffer);
        this.scannerBuffer = '';
      }
      return;
    }

    // Si es un dígito (para escáner), acumular en buffer
    if (event.key.length === 1 && /[0-9]/.test(event.key)) {
      this.scannerBuffer += event.key;

      // Limpiar timeout anterior
      if (this.scannerTimeout) clearTimeout(this.scannerTimeout);

      // Después de 150ms sin dígitos, procesar el código
      this.scannerTimeout = setTimeout(() => {
        if (this.scannerBuffer.length > 0) {
          this.buscarPorCodigo(this.scannerBuffer);
          this.scannerBuffer = '';
        }
      }, this.SCANNER_TIMEOUT);
    }
  }

  limpiar() {
    this.producto = null;
    this.codigoBusqueda = '';
    this.error = null;
    this.productosSugeridos = [];
    this.scannerBuffer = '';
    setTimeout(() => this.searchInput.nativeElement.focus(), 100);
  }

  agregarAlCarrito() {
    if (!this.producto) return;

    this.carritoService.agregarProducto(this.producto);
    this.snackBar.open(
      `✅ ${this.producto.nombre} agregado al carrito`,
      'Cerrar',
      { duration: 3000 },
    );
    this.limpiar();
  }
}
