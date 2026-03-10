import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  query,
  where,
  orderBy,
  Timestamp,
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';

export interface Venta {
  id?: string;
  fecha: Timestamp;
  items: Array<{
    productoId: string;
    nombre: string;
    cantidad: number;
    precio: number;
    subtotal: number;
  }>;
  total: number;
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia';
  montoPago: number;
  cambio: number;
  nota?: string;
  createdAt: Timestamp;
}

export interface ResumenVentas {
  totalVentas: number;
  totalIngresos: number;
  ventasEfectivo: number;
  ventasTarjeta: number;
  ventasTransferencia: number;
  productosVendidos: number;
}

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private firestore = inject(Firestore);
  private ventasRef = collection(this.firestore, 'ventas');

  /**
   * Obtener todas las ventas
   */
  getVentas(): Observable<Venta[]> {
    const q = query(this.ventasRef, orderBy('fecha', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Venta[]>;
  }

  /**
   * Obtener ventas de hoy
   */
  getVentasDelDia(): Observable<Venta[]> {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const q = query(
      this.ventasRef,
      where('fecha', '>=', Timestamp.fromDate(hoy)),
      where('fecha', '<', Timestamp.fromDate(manana)),
      orderBy('fecha', 'desc'),
    );

    return collectionData(q, { idField: 'id' }) as Observable<Venta[]>;
  }

  /**
   * Obtener resumen de ventas (totales)
   */
  getResumenVentas(): Observable<ResumenVentas> {
    return this.getVentasDelDia().pipe(
      map((ventas) => {
        const resumen: ResumenVentas = {
          totalVentas: ventas.length,
          totalIngresos: ventas.reduce((sum, v) => sum + v.total, 0),
          ventasEfectivo: ventas
            .filter((v) => v.metodoPago === 'efectivo')
            .reduce((sum, v) => sum + v.total, 0),
          ventasTarjeta: ventas
            .filter((v) => v.metodoPago === 'tarjeta')
            .reduce((sum, v) => sum + v.total, 0),
          ventasTransferencia: ventas
            .filter((v) => v.metodoPago === 'transferencia')
            .reduce((sum, v) => sum + v.total, 0),
          productosVendidos: ventas.reduce(
            (sum, v) => sum + v.items.reduce((s, i) => s + i.cantidad, 0),
            0,
          ),
        };
        return resumen;
      }),
    );
  }

  /**
   * Obtener ventas por rango de fechas
   */
  getVentasPorRango(fechaInicio: Date, fechaFin: Date): Observable<Venta[]> {
    const q = query(
      this.ventasRef,
      where('fecha', '>=', Timestamp.fromDate(fechaInicio)),
      where('fecha', '<=', Timestamp.fromDate(fechaFin)),
      orderBy('fecha', 'desc'),
    );

    return collectionData(q, { idField: 'id' }) as Observable<Venta[]>;
  }

  /**
   * Obtener productos más vendidos
   */
  getProductosMasVendidos(limite: number = 5): Observable<any[]> {
    return this.getVentas().pipe(
      map((ventas) => {
        const productos: {
          [key: string]: { nombre: string; cantidad: number; total: number };
        } = {};

        ventas.forEach((venta) => {
          venta.items.forEach((item) => {
            if (!productos[item.productoId]) {
              productos[item.productoId] = {
                nombre: item.nombre,
                cantidad: 0,
                total: 0,
              };
            }
            productos[item.productoId].cantidad += item.cantidad;
            productos[item.productoId].total += item.subtotal;
          });
        });

        return Object.values(productos)
          .sort((a, b) => b.cantidad - a.cantidad)
          .slice(0, limite);
      }),
    );
  }
}
