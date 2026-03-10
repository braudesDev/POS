import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartComponent } from '../../components/cart/cart.component';
import { ScannerComponent } from '../../components/scanner/scanner.component';
import { CheckoutComponent } from '../../components/checkout/checkout.component'; // ← NUEVO

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CartComponent,
    ScannerComponent,
    CheckoutComponent, // ← NUEVO
  ],
  templateUrl: './pos.component.html',
  styleUrls: ['./pos.component.css'],
})
export class PosComponent {
  onProductoAgregado() {
    console.log('Producto agregado al carrito');
  }
}
