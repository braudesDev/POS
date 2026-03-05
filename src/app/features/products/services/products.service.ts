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

@Injectable({
  providedIn: 'root', // Esto lo hace disponible en toda la app
})
export class ProductsService {
  private firestore = inject(Firestore);
  private storage = inject(Storage);

  private productosRef = collection(this.firestore, 'productos');

  /**
   * Obtener todos los productos
   */
  getProductos(): Observable<Producto[]> {
    const q = query(this.productosRef, orderBy('nombre'));
    return collectionData(q, { idField: 'id' }) as Observable<Producto[]>;
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
    const q = query(this.productosRef, where('codigoBarras', '==', codigo));
    return (
      collectionData(q, { idField: 'id' }) as Observable<Producto[]>
    ).pipe(
      map((productos) => (productos.length > 0 ? productos[0] : undefined)),
    );
  }

  /**
   * Crear un nuevo producto
   */
  crearProducto(producto: CreateProductoDTO): Observable<string> {
    // Agregar fechas
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
   * Subir imagen para un producto
   */
  subirImagen(productoId: string, file: File): Observable<string> {
    // Crear referencia en Storage
    const filePath = `productos/${productoId}/${Date.now()}_${file.name}`;
    const fileRef = ref(this.storage, filePath);

    // Subir archivo y obtener URL
    return from(uploadBytes(fileRef, file)).pipe(
      switchMap(() => from(getDownloadURL(fileRef))),
    );
  }

  /**
   * Actualizar solo la imagen de un producto
   */
  actualizarImagen(productoId: string, file: File): Observable<string> {
    return this.subirImagen(productoId, file).pipe(
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
