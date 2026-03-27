import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../shared/material/material.module';
import { MatSnackBar } from '@angular/material/snack-bar';

interface CodigoGenerado {
  id: string;
  texto: string;
  nombreProducto?: string;
  barcodeUrl: string;
  fecha: Date;
}

@Component({
  selector: 'app-barcode-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './barcode-list.html',
  styleUrls: ['./barcode-list.css'],
})
export class BarcodeList {
  private snackBar = inject(MatSnackBar);

  etiquetas: CodigoGenerado[] = [];

  constructor() {
    this.cargarEtiquetas();
  }

  private cargarEtiquetas() {
    const guardado = localStorage.getItem('codigos_barras');
    if (guardado) {
      this.etiquetas = JSON.parse(guardado);
    }
  }

  // ✅ DESCARGAR (icono de descarga)
  async descargar(etiqueta: CodigoGenerado) {
    try {
      const response = await fetch(etiqueta.barcodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `codigo-${etiqueta.texto}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      this.snackBar.open('📥 Código descargado', 'Cerrar', { duration: 2000 });
    } catch (error) {
      console.error('Error al descargar:', error);
      this.snackBar.open('❌ Error al descargar', 'Cerrar', { duration: 3000 });
    }
  }

  // También actualiza reimprimir si quieres el mismo comportamiento
  async reimprimir(etiqueta: CodigoGenerado) {
    try {
      const response = await fetch(etiqueta.barcodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `codigo-${etiqueta.texto}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      this.snackBar.open('🖨️ Código listo para imprimir', 'Cerrar', {
        duration: 2000,
      });
    } catch (error) {
      console.error('Error al descargar:', error);
      this.snackBar.open('❌ Error al descargar', 'Cerrar', { duration: 3000 });
    }
  }

  eliminar(id: string) {
    this.etiquetas = this.etiquetas.filter((e) => e.id !== id);
    localStorage.setItem('codigos_barras', JSON.stringify(this.etiquetas));
    this.snackBar.open('🗑️ Etiqueta eliminada', 'Cerrar', { duration: 2000 });
  }
}
