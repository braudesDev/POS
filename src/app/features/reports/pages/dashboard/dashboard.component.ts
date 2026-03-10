import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  ReportsService,
  ResumenVentas,
  Venta,
} from '../../services/reports.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private reportsService = inject(ReportsService);

  cargando = true;
  error: string | null = null;

  resumen: ResumenVentas | null = null;
  productosTop: any[] = [];
  ultimasVentas: Venta[] = [];

  porcentajeEfectivo = 0;
  porcentajeTarjeta = 0;
  porcentajeTransferencia = 0;

  private subscriptions: Subscription[] = [];

  ngOnInit() {
    this.cargarDatos();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  cargarDatos() {
    this.cargando = true;
    this.error = null;

    // Cargar resumen
    this.subscriptions.push(
      this.reportsService.getResumenVentas().subscribe({
        next: (resumen) => {
          this.resumen = resumen;
          this.calcularPorcentajes(resumen);
        },
        error: (err) => {
          console.error('Error cargando resumen:', err);
          this.error = 'Error al cargar el resumen de ventas';
          this.cargando = false;
        },
      }),
    );

    // Cargar productos más vendidos
    this.subscriptions.push(
      this.reportsService.getProductosMasVendidos(5).subscribe({
        next: (productos) => {
          this.productosTop = productos;
        },
        error: (err) => console.error('Error cargando productos:', err),
      }),
    );

    // Cargar últimas ventas
    this.subscriptions.push(
      this.reportsService.getVentasDelDia().subscribe({
        next: (ventas) => {
          this.ultimasVentas = ventas.slice(0, 5);
          this.cargando = false;
        },
        error: (err) => {
          console.error('Error cargando ventas:', err);
          this.error = 'Error al cargar las ventas';
          this.cargando = false;
        },
      }),
    );
  }

  private calcularPorcentajes(resumen: ResumenVentas) {
    const total = resumen.totalIngresos;
    if (total > 0) {
      this.porcentajeEfectivo = (resumen.ventasEfectivo / total) * 100;
      this.porcentajeTarjeta = (resumen.ventasTarjeta / total) * 100;
      this.porcentajeTransferencia =
        (resumen.ventasTransferencia / total) * 100;
    }
  }
}
