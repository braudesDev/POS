import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, deleteDoc, doc, query, orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface CodigoGenerado {
  id?: string;
  texto: string;
  nombreProducto?: string;
  barcodeUrl: string;
  fecha: Date;
}

@Injectable({
  providedIn: 'root',
})
export class BarcodeService {
  private firestore = inject(Firestore);
  private etiquetasRef = collection(this.firestore, 'etiquetas');

  /**
   * Obtener todas las etiquetas
   */
  getEtiquetas(): Observable<CodigoGenerado[]> {
    const q = query(this.etiquetasRef, orderBy('fecha', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<CodigoGenerado[]>;
  }

  /**
   * Guardar una nueva etiqueta en Firestore
   */
  async guardarEtiqueta(etiqueta: Omit<CodigoGenerado, 'id'>): Promise<string> {
    const docRef = await addDoc(this.etiquetasRef, etiqueta);
    return docRef.id;
  }

  /**
   * Eliminar etiqueta de Firestore (¡sin necesidad de Cloud Functions!)
   */
  async eliminarEtiqueta(id: string): Promise<void> {
    const docRef = doc(this.firestore, `etiquetas/${id}`);
    await deleteDoc(docRef);
  }
}
