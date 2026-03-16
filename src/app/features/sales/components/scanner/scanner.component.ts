import {
  Component,
  Output,
  EventEmitter,
  inject,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CarritoService } from '../../services/carrito.service';
import { MaterialModule } from '../../../../shared/material/material.module';

@Component({
  selector: 'app-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './scanner.component.html',
  styleUrls: ['./scanner.component.css'],
})
export class ScannerComponent implements AfterViewInit {
  @Output() productoAgregado = new EventEmitter<any>();
  @ViewChild('scannerInput') scannerInput!: ElementRef;

  private carritoService = inject(CarritoService);

  modoManual = false;
  codigoManual = '';
  mensaje = '';
  mensajeError = false;
  scannerActivo = true;
  private codigoBuffer = '';
  private timeoutId: any;
  private readonly TIMEOUT_MS = 150; // 150ms de inactividad

  ngAfterViewInit(): void {
    //Itentar enfocar inmediatamente, pero también establecer un timeout por si el enfoque falla inicialmente
    this.enfocarScanner();

    //Reiniciar despues de un segundo para asegurar que el input esté listo
    setTimeout(() => {
      if (!this.scannerActivo) {
        this.enfocarScanner();
      }
    }, 1000);
  }

  enfocarScanner() {
    this.scannerActivo = true;
    this.mensaje = 'Escáner activo - Escanea ahora';
    setTimeout(() => {
      this.scannerInput.nativeElement.focus();
      console.log(
        'Input enfocado:',
        document.activeElement === this.scannerInput.nativeElement,
      );
    }, 100);
  }

  onFocus() {
    this.scannerActivo = true;
    this.mensaje = 'Escáner activo - Escanea ahora';
  }

  onBlur() {
    this.scannerActivo = true; // Mantener activo para seguir recibiendo eventos
    this.mensaje = '';
  }

  onKeyDown(event: KeyboardEvent) {
    // Ignorar teclas de control
    if (
      event.key === 'Shift' ||
      event.key === 'Control' ||
      event.key === 'Alt' ||
      event.key === 'Meta'
    ) {
      return;
    }

    // Prevenir comportamiento por defecto (evitar que escriba en otros lados)
    event.preventDefault();

    // Limpiar timeout anterior
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Si es Enter, procesar inmediatamente
    if (event.key === 'Enter') {
      if (this.codigoBuffer.length > 0) {
        console.log('Enter detectado, procesando:', this.codigoBuffer);
        this.procesarCodigo(this.codigoBuffer);
        this.codigoBuffer = '';
        //Importante: no dejar que el timeout tambien procese
        if (this.timeoutId) {
          clearTimeout(this.timeoutId);
          this.timeoutId = null;
        }
      }
      return;
    }

    // Si es un carácter imprimible, acumular
    if (event.key.length === 1) {
      // Solo permitir dígitos (opcional, depende de tu caso)
      if (/[0-9]/.test(event.key)) {
        this.codigoBuffer += event.key;
        console.log('Buffer actualizado:', this.codigoBuffer);

        // Establecer timeout para procesar después de inactividad
        this.timeoutId = setTimeout(() => {
          if (this.codigoBuffer.length > 0) {
            console.log(
              'Timeout por inactividad, procesando:',
              this.codigoBuffer,
            );
            this.procesarCodigo(this.codigoBuffer);
            this.codigoBuffer = '';
          }
        }, this.TIMEOUT_MS);
      }
    }
  }

  // Agrega este método a la clase ScannerComponent
  cambiarModo(modo: boolean) {
    this.modoManual = modo;
    if (!modo) {
      // Si cambia a modo automático, enfocar el escáner
      setTimeout(() => this.enfocarScanner(), 100);
    }
  }

  buscarCodigo() {
    if (this.codigoManual) {
      this.procesarCodigo(this.codigoManual);
      this.codigoManual = '';
    }
  }

  private procesarCodigo(codigo: string) {
    console.log('🔍 Procesando código:', codigo);
    this.mensaje = 'Buscando producto...';
    this.mensajeError = false;

    this.carritoService.agregarPorCodigo(codigo).subscribe({
      next: (resultado) => {
        this.mensaje = resultado.message;
        this.mensajeError = !resultado.success;

        // Opcional: comportamiento específico por tipo de error
        if (resultado.tipo === 'stock_insuficiente') {
          console.warn('⚠️ Alerta de stock:', resultado.message);
          // Aquí podrías hacer un sonido o vibrar
        }

        if (resultado.success) {
          this.productoAgregado.emit();
        }
      },
      error: (err) => {
        this.mensaje = '❌ Error al buscar producto';
        this.mensajeError = true;
        console.error('Error:', err);
      },
    });
  }
}
