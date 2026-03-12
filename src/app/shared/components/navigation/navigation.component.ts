import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { MaterialModule } from '../../material/material.module';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { MatSidenav } from '@angular/material/sidenav';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, ThemeToggleComponent],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css'],
})
export class NavigationComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  mostrarBreadcrumbs = true;
  breadcrumbs: Array<{ path: string; label: string }> = [];

  constructor(private router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // Cerrar el menú después de navegar (en móvil)
        if (this.sidenav && window.innerWidth <= 600) {
          this.sidenav.close();
        }
      }
    });
  }

  cerrarSesion() {
    // Aquí irá la lógica de cierre de sesión
    this.router.navigate(['/login']);
  }
}
