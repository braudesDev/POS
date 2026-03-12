import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ReportsService, Venta } from '../../services/reports.service';
import { MaterialModule } from '../../../../shared/material/material.module';
import { ThemeToggleComponent } from '../../../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-sales-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MaterialModule,
    ThemeToggleComponent,
  ],
  templateUrl: './sales-history.component.html',
  styleUrls: ['./sales-history.component.css'],
})
export class SalesHistoryComponent implements OnInit {
  private reportsService = inject(ReportsService);

  ventas: (Venta & { mostrarDetalle?: boolean })[] = [];
  cargando = true;
  error: string | null = null;

  fechaInicio: string = this.getFechaInicioMes();
  fechaFin: string = this.getFechaHoy();
  totalPeriodo = 0;

  ngOnInit() {
    this.cargarVentas();
  }

  getFechaHoy(): string {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  }

  getFechaInicioMes(): string {
    const hoy = new Date();
    const primero = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    return primero.toISOString().split('T')[0];
  }

  cargarVentas() {
    if (!this.fechaInicio || !this.fechaFin) return;

    this.cargando = true;
    this.error = null;

    const inicio = new Date(this.fechaInicio);
    inicio.setHours(0, 0, 0, 0);

    const fin = new Date(this.fechaFin);
    fin.setHours(23, 59, 59, 999);

    this.reportsService.getVentasPorRango(inicio, fin).subscribe({
      next: (ventas) => {
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
    this.fechaInicio = this.getFechaInicioMes();
    this.fechaFin = this.getFechaHoy();
    this.cargarVentas();
  }

  toggleDetalle(venta: any) {
    venta.mostrarDetalle = !venta.mostrarDetalle;
  }

  imprimirTicket(venta: Venta) {
    // Por ahora solo un mensaje, luego implementaremos la impresión
    console.log('Imprimir ticket:', venta);
    alert('Funcionalidad de impresión próximamente');
  }

  displayedColumns: string[] = [
    'fecha',
    'hora',
    'productos',
    'total',
    'metodo',
    'acciones',
  ];
}
