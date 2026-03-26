import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../shared/material/material.module';
import { ProductsService } from '../../products/services/products.service';
import { MatSnackBar } from '@angular/material/snack-bar';

interface CodigoGenerado {
  id: string;
  texto: string;
  nombreProducto?: string;
  barcodeData: string;
  fecha: Date;
}

@Component({
  selector: 'app-barcode-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MaterialModule],
  templateUrl: './barcode-generator.html',
  styleUrls: ['./barcode-generator.css'],
})
export class BarcodeGenerator {
  private productsService = inject(ProductsService);
  private snackBar = inject(MatSnackBar);

  codigoTexto: string = '';
  nombreProducto: string = '';
  barcodeUrl: string | null = null;
  private barcodeData: string | null = null;

  // Cargar historial al iniciar
  constructor() {
    this.cargarHistorial();
  }

  private cargarHistorial() {
    const guardado = localStorage.getItem('codigos_barras');
    if (guardado) {
      // Solo cargamos para mantener, no lo mostramos aquí
      JSON.parse(guardado);
    }
  }

  private guardarHistorial(nuevoCodigo: CodigoGenerado) {
    const guardado = localStorage.getItem('codigos_barras');
    let historial: CodigoGenerado[] = guardado ? JSON.parse(guardado) : [];
    historial.unshift(nuevoCodigo); // Agregar al inicio
    localStorage.setItem('codigos_barras', JSON.stringify(historial));
  }

  async generarCodigo() {
    if (!this.codigoTexto) return;

    try {
      const JsBarcode = (await import('jsbarcode')).default;
      const canvas = document.createElement('canvas');

      JsBarcode(canvas, this.codigoTexto, {
        format: 'CODE128',
        width: 2,
        height: 100,
        margin: 10,
        displayValue: true,
      });

      this.barcodeUrl = canvas.toDataURL('image/png');
      this.barcodeData = this.codigoTexto;

      // GUARDAR EN HISTORIAL
      const nuevoCodigo: CodigoGenerado = {
        id: Date.now().toString(),
        texto: this.codigoTexto,
        nombreProducto: this.nombreProducto || undefined,
        barcodeData: this.barcodeUrl,
        fecha: new Date(),
      };
      this.guardarHistorial(nuevoCodigo);

      this.snackBar.open('✅ Código generado exitosamente', 'Cerrar', {
        duration: 3000,
      });
    } catch (error) {
      console.error('Error generando código:', error);
      this.snackBar.open('❌ Error al generar el código', 'Cerrar', {
        duration: 3000,
      });
    }
  }

  descargarPNG() {
    if (!this.barcodeUrl) return;

    const link = document.createElement('a');
    link.download = `codigo-${this.codigoTexto}.png`;
    link.href = this.barcodeUrl;
    link.click();

    this.snackBar.open('📥 Código descargado', 'Cerrar', { duration: 2000 });
  }

  descargarSVG() {
    if (!this.barcodeData) return;
    this.descargarPNG();
  }

  async agregarAlProducto() {
    if (!this.nombreProducto || !this.barcodeData) return;

    this.productsService.getProductos().subscribe({
      next: (productos) => {
        const producto = productos.find(
          (p) => p.nombre.toLowerCase() === this.nombreProducto.toLowerCase(),
        );

        if (producto) {
          this.productsService
            .actualizarProducto(producto.id!, {
              codigoBarras: this.barcodeData!,
            })
            .subscribe({
              next: () => {
                this.snackBar.open(
                  `✅ Código asignado a "${producto.nombre}"`,
                  'Cerrar',
                  { duration: 4000 },
                );
                this.limpiar();
              },
              error: () => {
                this.snackBar.open('❌ Error al asignar código', 'Cerrar', {
                  duration: 3000,
                });
              },
            });
        } else {
          this.snackBar.open(
            `❌ Producto "${this.nombreProducto}" no encontrado`,
            'Cerrar',
            { duration: 3000 },
          );
        }
      },
    });
  }

  limpiar() {
    this.codigoTexto = '';
    this.nombreProducto = '';
    this.barcodeUrl = null;
    this.barcodeData = null;
  }
}
