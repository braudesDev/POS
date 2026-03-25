import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ReportsService, Venta } from '../../services/reports.service';
import { MaterialModule } from '../../../../shared/material/material.module';

@Component({
  selector: 'app-sales-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MaterialModule],
  templateUrl: './sales-history.component.html',
  styleUrls: ['./sales-history.component.css'],
})
export class SalesHistoryComponent implements OnInit {
  private reportsService = inject(ReportsService);

  ventas: (Venta & { mostrarDetalle?: boolean })[] = [];
  cargando = true;
  error: string | null = null;
  totalPeriodo = 0;

  // Para el datepicker (objetos Date)
  fechaInicioObj: Date = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  );
  fechaFinObj: Date = new Date();

  // Strings para mantener compatibilidad (opcional)
  fechaInicio: string = '';
  fechaFin: string = '';

  displayedColumns: string[] = [
    'fecha',
    'hora',
    'productos',
    'total',
    'metodo',
    'acciones',
  ];

  ngOnInit() {
    this.cargarVentas();
  }

  // Método auxiliar para formatear fecha a YYYY-MM-DD
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  cargarVentas() {
    if (!this.fechaInicioObj || !this.fechaFinObj) return;

    this.cargando = true;
    this.error = null;

    // Crear fechas UTC para evitar problemas de zona horaria
    const inicio = new Date(
      Date.UTC(
        this.fechaInicioObj.getFullYear(),
        this.fechaInicioObj.getMonth(),
        this.fechaInicioObj.getDate(),
        0,
        0,
        0,
      ),
    );

    const fin = new Date(
      Date.UTC(
        this.fechaFinObj.getFullYear(),
        this.fechaFinObj.getMonth(),
        this.fechaFinObj.getDate(),
        23,
        59,
        59,
        999,
      ),
    );

    console.log('📅 Buscando ventas entre:', inicio, 'y', fin);

    this.reportsService.getVentasPorRango(inicio, fin).subscribe({
      next: (ventas) => {
        console.log('📊 Ventas encontradas:', ventas.length);
        this.ventas = ventas.map((v) => ({ ...v, mostrarDetalle: false }));
        this.totalPeriodo = ventas.reduce((sum, v) => sum + v.total, 0);
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando ventas:', err);
        this.error = 'Error al cargar el historial de ventas';
        this.cargando = false;
      },
    });
  }

  resetFiltros() {
    // Resetear al primer día del mes actual
    const hoy = new Date();
    this.fechaInicioObj = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.fechaFinObj = new Date();
    this.cargarVentas();
  }

  toggleDetalle(venta: any) {
    venta.mostrarDetalle = !venta.mostrarDetalle;
  }

  imprimirTicket(venta: Venta) {
    console.log('🖨️ Reimprimir ticket:', venta);
    alert('📄 Funcionalidad de reimpresión en desarrollo');
  }
}
