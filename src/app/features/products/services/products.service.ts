import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from '@angular/fire/firestore';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
} from '@angular/fire/storage';
import { Observable, from, map, switchMap } from 'rxjs';
import {
  Producto,
  CreateProductoDTO,
  UpdateProductoDTO,
} from '../models/producto.model';
import { CloudinaryService } from '../../../core/cloudinary/cloudinary.service';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private firestore = inject(Firestore);
  private storage = inject(Storage);

  private productosRef = collection(this.firestore, 'productos');
  private cloudinary = inject(CloudinaryService);

  /**
   * Obtener todos los productos
   */
  getProductos(): Observable<Producto[]> {
    const productosQuery = query(this.productosRef, orderBy('nombre'));
    // Versión SIMPLE sin runInInjectionContext
    return collectionData(productosQuery, { idField: 'id' }) as Observable<
      Producto[]
    >;
  }

  /**
   * Obtener un producto por su ID
   */
  getProductoById(id: string): Observable<Producto | undefined> {
    const docRef = doc(this.firestore, `productos/${id}`);
    return docData(docRef, { idField: 'id' }) as Observable<
      Producto | undefined
    >;
  }

  /**
   * Buscar producto por código de barras
   */
  getProductoByCodigo(codigo: string): Observable<Producto | undefined> {
    const productosQuery = query(
      this.productosRef,
      where('codigoBarras', '==', codigo),
    );
    return (
      collectionData(productosQuery, { idField: 'id' }) as Observable<
        Producto[]
      >
    ).pipe(
      map((productos) => (productos.length > 0 ? productos[0] : undefined)),
    );
  }

  /**
   * Crear un nuevo producto
   */
  crearProducto(producto: CreateProductoDTO): Observable<string> {
    const productoConFechas = {
      ...producto,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    return from(addDoc(this.productosRef, productoConFechas)).pipe(
      map((docRef) => docRef.id),
    );
  }

  /**
   * Actualizar un producto existente
   */
  actualizarProducto(id: string, cambios: UpdateProductoDTO): Observable<void> {
    const docRef = doc(this.firestore, `productos/${id}`);
    const cambiosConFecha = {
      ...cambios,
      updatedAt: Timestamp.now(),
    };
    return from(updateDoc(docRef, cambiosConFecha));
  }

  /**
   * Eliminar un producto
   */
  eliminarProducto(id: string): Observable<void> {
    const docRef = doc(this.firestore, `productos/${id}`);
    return from(deleteDoc(docRef));
  }

  /**
   * Subir imagen a Cloudinary
   * @param file Archivo de imagen
   * @returns Observable con la URL de la imagen en Cloudinary
   */
  subirImagen(file: File): Observable<string> {
    return this.cloudinary.subirImagen(file);
  }

  /**
   * Subir imagen a Cloudinary y actualizar el producto en Firestore
   * @param productoId ID del producto
   * @param file Archivo de imagen
   * @returns Observable con la URL de la imagen
   */
  actualizarImagen(productoId: string, file: File): Observable<string> {
    return this.subirImagen(file).pipe(
      switchMap((url) => {
        const docRef = doc(this.firestore, `productos/${productoId}`);
        return from(
          updateDoc(docRef, {
            imagenUrl: url,
            updatedAt: Timestamp.now(),
          }),
        ).pipe(map(() => url));
      }),
    );
  }
}
