import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductsService } from '../../services/products.service';
import { Producto } from '../../models/producto.model';
import { MaterialModule } from '../../../../shared/material/material.module';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MaterialModule,
    MatProgressSpinner,
  ],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css'],
})
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productsService = inject(ProductsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  productoForm: FormGroup;
  editMode = false;
  loading = false;
  submitting = false;
  error: string | null = null;
  productoActual: Producto | null = null;
  imagenPreview: string | null = null;
  imagenFile: File | null = null;

  constructor() {
    this.productoForm = this.fb.group({
      codigoBarras: ['', [Validators.minLength(3)]],
      nombre: ['', Validators.required],
      descripcion: [''],
      precio: [0, [Validators.required, Validators.min(0.01)]],
      categoria: ['', Validators.required],
      stock: [0, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editMode = true;
      this.cargarProducto(id);
    }
  }

  cargarProducto(id: string) {
    this.loading = true;
    this.productsService.getProductoById(id).subscribe({
      next: (producto) => {
        if (producto) {
          this.productoActual = producto;
          this.productoForm.patchValue({
            codigoBarras: producto.codigoBarras,
            nombre: producto.nombre,
            descripcion: producto.descripcion || '',
            precio: producto.precio,
            categoria: producto.categoria,
            stock: producto.stock,
          });
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando producto:', err);
        this.error = 'Error al cargar el producto';
        this.loading = false;
      },
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.productoForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  onImagenSeleccionada(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.imagenFile = file;

      // Crear preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagenPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.productoForm.invalid) {
      Object.keys(this.productoForm.controls).forEach((key) => {
        this.productoForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.submitting = true;
    this.error = null;

    const productoData = this.productoForm.value;

    if (this.editMode && this.productoActual?.id) {
      // Actualizar producto existente
      this.productsService
        .actualizarProducto(this.productoActual.id, productoData)
        .subscribe({
          next: () => {
            if (this.imagenFile && this.productoActual?.id) {
              // Si hay imagen, subirla después de actualizar
              this.subirImagenYRedirigir(this.productoActual.id);
            } else {
              this.router.navigate(['/productos']);
            }
          },
          error: (err) => {
            console.error('Error actualizando producto:', err);
            this.error = 'Error al actualizar el producto';
            this.submitting = false;
          },
        });
    } else {
      // Crear nuevo producto
      this.productsService.crearProducto(productoData).subscribe({
        next: (id) => {
          console.log('✅ Producto creado con ID:', id);
          if (this.imagenFile) {
            this.subirImagenYRedirigir(id);
          } else {
            this.submitting = false; // <-- AÑADE ESTA LÍNEA
            this.router.navigate(['/productos']).then(() => {
              console.log('✅ Redirigido a lista de productos');
            });
          }
        },
        error: (err) => {
          console.error('❌ Error creando producto:', err);
          this.error = 'Error al crear el producto';
          this.submitting = false; // <-- YA ESTÁ, PERO VERIFICA
        },
      });
    }
  }

  private subirImagenYRedirigir(productoId: string) {
    if (!this.imagenFile) {
      this.router.navigate(['/productos']);
      return;
    }

    this.productsService
      .actualizarImagen(productoId, this.imagenFile)
      .subscribe({
        next: () => {
          this.router.navigate(['/productos']);
        },
        error: (err) => {
          console.error('Error subiendo imagen:', err);
          // Aún así redirigimos, el producto ya se creó
          this.router.navigate(['/productos']);
        },
      });
  }
}
