import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
import { CloudinaryService } from '../../../../core/cloudinary/cloudinary.service';
import { BarcodeService } from '../../../barcode/barcode.service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MaterialModule,
    MatTooltipModule,
    MatProgressSpinner,
    FormsModule,
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
})
export class ProductListComponent implements OnInit {
  private productsService = inject(ProductsService);
  private cloudinaryService = inject(CloudinaryService);
  private barcodeService = inject(BarcodeService);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  productos: Producto[] = [];
  loading = true;
  error: string | null = null;

  terminoBusqueda: string = '';
  productosFiltrados: Producto[] = [];

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
        this.productosFiltrados = [...productos];
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

  filtrarProductos() {
    if (!this.terminoBusqueda.trim()) {
      this.productosFiltrados = [...this.productos];
      return;
    }

    const termino = this.terminoBusqueda.toLowerCase().trim();
    this.productosFiltrados = this.productos.filter(
      (producto) =>
        producto.nombre.toLowerCase().includes(termino) ||
        producto.codigoBarras.toLowerCase().includes(termino),
    );
  }

  limpiarBusqueda() {
    this.terminoBusqueda = '';
    this.productosFiltrados = [...this.productos];
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

  async generarEtiqueta(producto: Producto) {
    // 1. Generar código numérico con timestamp
    const codigo = Date.now().toString().slice(-12);
    console.log('📦 Código generado:', codigo);

    // 2. Importar JsBarcode
    const JsBarcode = (await import('jsbarcode')).default;
    const canvas = document.createElement('canvas');

    JsBarcode(canvas, codigo, {
      format: 'CODE128',
      width: 2,
      height: 100,
      margin: 10,
      displayValue: true,
    });

    // 3. Convertir canvas a Blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('No se pudo generar la imagen'));
        }
      }, 'image/png');
    });

    // 4. Subir a Cloudinary
    const file = new File([blob], `etiqueta-${codigo}.png`, {
      type: 'image/png',
    });
    const url = await this.cloudinaryService
      .subirImagen(file, 'pdv/etiquetas')
      .toPromise();

    // 5. Guardar en Firestore (colección etiquetas)
    await this.barcodeService.guardarEtiqueta({
      texto: codigo,
      nombreProducto: producto.nombre,
      barcodeUrl: url!,
      fecha: new Date(),
    });

    // 6. Actualizar el producto con el código
    await this.productsService
      .actualizarProducto(producto.id!, {
        codigoBarras: codigo,
      })
      .toPromise();

    // 7. Descargar la imagen
    const link = document.createElement('a');
    link.download = `etiqueta-${codigo}.png`;
    link.href = url!;
    link.click();

    this.snackBar.open(`✅ Etiqueta generada con código ${codigo}`, 'Cerrar', {
      duration: 5000,
    });
  }
}
