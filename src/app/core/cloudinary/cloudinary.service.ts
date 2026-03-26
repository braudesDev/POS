import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CloudinaryService {
  private http = inject(HttpClient);

  private cloudName = environment.cloudinary.cloudName;
  private uploadPresetProductos = environment.cloudinary.uploadPreset;
  private uploadPresetEtiquetas = environment.cloudinary.uploadPresetEtiquetas;
  private uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

  /**
   * Subir una imagen a Cloudinary
   * @param file Archivo a subir
   * @param tipo 'producto' o 'etiqueta'
   */
  subirImagen(
    file: File,
    tipo: 'producto' | 'etiqueta' = 'producto',
  ): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    const uploadPreset =
      tipo === 'producto'
        ? this.uploadPresetProductos
        : this.uploadPresetEtiquetas;
    formData.append('upload_preset', uploadPreset);

    // 🔴 NUEVO: Enviar la carpeta manualmente
    const folder = tipo === 'producto' ? 'pdv/productos' : 'pdv/etiquetas';
    formData.append('folder', folder);

    return this.http
      .post<any>(this.uploadUrl, formData)
      .pipe(map((response) => response.secure_url));
  }
}
