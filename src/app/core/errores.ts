import { HttpErrorResponse } from '@angular/common/http';

// =====================================================================
// Convierte cualquier error en un texto para el usuario.
// Nuestra API (FastAPI) devuelve los errores como { "detail": "..." }.
// Lo usan los servicios y el componente de estado → escrito una vez.
// =====================================================================
export function mensajeError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No se puede conectar con la API. ¿Está arrancada en el puerto 8000?';
    }
    const detalle = error.error?.detail;
    return typeof detalle === 'string' ? detalle : `Error ${error.status}: ${error.statusText}`;
  }
  return error instanceof Error ? error.message : 'Error desconocido';
}
