export interface Producto {
  id?: string; // Opcional porque Firebase lo genera
  codigoBarras: string; // Código de barras (único)
  nombre: string; // Nombre del producto
  descripcion?: string; // Opcional
  precio: number; // Precio de venta
  categoria: 'cosmeticos' | 'peluches' | 'bolsas' | 'carteras' | 'otros';
  stock: number; // Cantidad disponible
  imagenUrl?: string; // Opcional, URL de la imagen en Storage
  createdAt?: Date; // Fecha de creación (opcional, lo pondrá Firebase)
  updatedAt?: Date; // Fecha de actualización (opcional)
}

// Tipo para crear un producto nuevo (sin id ni fechas)
export type CreateProductoDTO = Omit<
  Producto,
  'id' | 'createdAt' | 'updatedAt'
>;

// Tipo para actualizar (todos los campos son opcionales)
export type UpdateProductoDTO = Partial<CreateProductoDTO>;
