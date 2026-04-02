import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../shared/material/material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BarcodeService, CodigoGenerado } from '../barcode.service';

@Component({
  selector: 'app-barcode-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './barcode-list.html',
  styleUrls: ['./barcode-list.css'],
})
export class BarcodeList implements OnInit {
  private snackBar = inject(MatSnackBar);
  private barcodeService = inject(BarcodeService);

  etiquetas: CodigoGenerado[] = [];

  ngOnInit() {
    // Cargar desde Firestore
    this.barcodeService.getEtiquetas().subscribe((etiquetas) => {
      this.etiquetas = etiquetas;
    });
  }

  // ✅ DESCARGAR
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

  // ✅ REIMPRIMIR
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

  // ✅ ELIMINAR (solo de Firestore, sin Cloudinary ni localStorage)
  async eliminar(etiqueta: CodigoGenerado) {
    if (!etiqueta.id) return;

    try {
      await this.barcodeService.eliminarEtiqueta(etiqueta.id);
      this.snackBar.open('🗑️ Etiqueta eliminada', 'Cerrar', { duration: 3000 });
    } catch (error) {
      console.error('Error al eliminar:', error);
      this.snackBar.open('❌ Error al eliminar', 'Cerrar', { duration: 3000 });
    }
  }
}
