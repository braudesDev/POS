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
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './product-viewer.component.html',
  styleUrls: ['./product-viewer.component.css'],
})
export class ProductViewerComponent implements AfterViewInit {
  @ViewChild('codigoInput') codigoInput!: ElementRef<HTMLInputElement>;

  private productsService = inject(ProductsService);

  codigoBusqueda: string = '';
  producto: Producto | null = null;
  loading = false;
  error: string | null = null;

  private codigoBuffer = '';
  private timeoutId: any;
  private readonly TIMEOUT_MS = 150;
  private carritoService = inject(CarritoService);
  private snackBar = inject(MatSnackBar);

  ngAfterViewInit() {
    // Enfocar automáticamente al cargar la página
    setTimeout(() => {
      this.codigoInput.nativeElement.focus();
    }, 100);
  }

  // Para el escáner (misma lógica que el scanner component)
  onKeyDown(event: KeyboardEvent) {
    if (['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) return;
    event.preventDefault();

    if (this.timeoutId) clearTimeout(this.timeoutId);

    if (event.key === 'Enter' && this.codigoBuffer.length > 0) {
      this.buscarPorCodigo(this.codigoBuffer);
      this.codigoBuffer = '';
      return;
    }

    if (event.key.length === 1 && /[0-9]/.test(event.key)) {
      this.codigoBuffer += event.key;
      this.timeoutId = setTimeout(() => {
        if (this.codigoBuffer.length > 0) {
          this.buscarPorCodigo(this.codigoBuffer);
          this.codigoBuffer = '';
        }
      }, this.TIMEOUT_MS);
    }
  }

  buscarManual() {
    if (this.codigoBusqueda) {
      this.buscarPorCodigo(this.codigoBusqueda);
      this.codigoBusqueda = '';
    }
  }

  private buscarPorCodigo(codigo: string) {
    this.loading = true;
    this.error = null;
    this.producto = null;

    this.productsService.getProductoByCodigo(codigo).subscribe({
      next: (producto) => {
        if (producto) {
          this.producto = producto;
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

  limpiar() {
    this.producto = null;
    this.codigoBusqueda = '';
    this.error = null;
  }

  agregarAlCarrito() {
    if (!this.producto) return;

    this.carritoService.agregarProducto(this.producto);
    this.snackBar.open(
      `✅ ${this.producto.nombre} agregado al carrito`,
      'Cerrar',
      { duration: 3000 },
    );

    // Limpiar después de agregar
    this.limpiar();
  }
}
