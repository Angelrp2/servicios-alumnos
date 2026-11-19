// =====================================================================
// MODELO: describe CÓMO es un alumno (es un "contrato" de campos).
// No tiene lógica ni datos, solo la forma. Lo importan el servicio
// y los componentes para que TypeScript avise si usas mal los datos.
// =====================================================================
export interface Alumno {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  curso: string;
  notaMedia: number;
}
