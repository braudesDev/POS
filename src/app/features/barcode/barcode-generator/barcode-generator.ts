import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../shared/material/material.module';
import { ProductsService } from '../../products/services/products.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CloudinaryService } from '../../../core/cloudinary/cloudinary.service'; // ← IMPORTAR

interface CodigoGenerado {
  id: string;
  texto: string;
  nombreProducto?: string;
  barcodeUrl: string; // ← Cambiado: ahora es URL de Cloudinary
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
  private cloudinaryService = inject(CloudinaryService); // ← NUEVO
  private snackBar = inject(MatSnackBar);

  codigoTexto: string = '';
  nombreProducto: string = '';
  barcodeUrl: string | null = null;
  private barcodeData: string | null = null;
  public subiendo = false; // ← NUEVO

  constructor() {
    this.cargarHistorial();
  }

  private cargarHistorial() {
    const guardado = localStorage.getItem('codigos_barras');
    if (guardado) {
      JSON.parse(guardado);
    }
  }

  private async guardarEnCloudinary(blob: Blob): Promise<string> {
    const file = new File([blob], `codigo-${this.codigoTexto}.png`, {
      type: 'image/png',
    });

    return new Promise((resolve, reject) => {
      this.cloudinaryService.subirImagen(file, 'pdv/etiquetas').subscribe({
        next: (url) => resolve(url),
        error: (err) => reject(err),
      });
    });
  }

  private guardarHistorial(urlCloudinary: string) {
    const nuevoCodigo: CodigoGenerado = {
      id: Date.now().toString(),
      texto: this.codigoTexto,
      nombreProducto: this.nombreProducto || undefined,
      barcodeUrl: urlCloudinary,
      fecha: new Date(),
    };

    const guardado = localStorage.getItem('codigos_barras');
    let historial: CodigoGenerado[] = guardado ? JSON.parse(guardado) : [];
    historial.unshift(nuevoCodigo);
    localStorage.setItem('codigos_barras', JSON.stringify(historial));
  }

  async generarCodigo() {
    if (!this.codigoTexto) return;

    this.subiendo = true;

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

      // Convertir canvas a Blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });

      // Subir a Cloudinary
      const cloudinaryUrl = await this.guardarEnCloudinary(blob);

      this.barcodeUrl = cloudinaryUrl;
      this.barcodeData = this.codigoTexto;

      // Guardar en historial (con URL de Cloudinary)
      this.guardarHistorial(cloudinaryUrl);

      this.snackBar.open('✅ Código generado y guardado en la nube', 'Cerrar', {
        duration: 3000,
      });
    } catch (error) {
      console.error('Error generando código:', error);
      this.snackBar.open('❌ Error al generar el código', 'Cerrar', {
        duration: 3000,
      });
    } finally {
      this.subiendo = false;
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
