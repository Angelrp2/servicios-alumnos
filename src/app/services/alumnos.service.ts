import { Injectable, computed, effect, signal } from '@angular/core';
import { Alumno } from '../models/alumno.model';

// Nombre de la "caja" donde guardamos los alumnos en el navegador.
const CLAVE_STORAGE = 'alumnos';

// Datos de ejemplo: solo se usan la PRIMERA vez (cuando aún no hay nada guardado).
const ALUMNOS_INICIALES: Alumno[] = [
  { id: 1, nombre: 'Ana', apellidos: 'García López', email: 'ana@digitech.es', curso: '2º DAM', notaMedia: 8.5 },
  { id: 2, nombre: 'Luis', apellidos: 'Martín Ruiz', email: 'luis@digitech.es', curso: '2º DAM', notaMedia: 6.2 },
  { id: 3, nombre: 'Sara', apellidos: 'López Díaz', email: 'sara@digitech.es', curso: '1º DAM', notaMedia: 9.1 },
];

// =====================================================================
// SERVICIO CON SIGNALS (versión 2 · lección "Signals: introducción práctica")
//
// Diferencia con la versión 1 (en apuntes/v1-alumnos.service.ts.txt):
//   v1 → los datos eran un array normal. El componente tenía que copiar
//        los datos a su propio signal y refrescarlo con .set() a mano.
//   v2 → los datos SON un signal dentro del servicio. Cualquier componente
//        que lo lea se actualiza solo. Se acabó el refresco manual.
// =====================================================================
@Injectable({ providedIn: 'root' })
export class AlumnosService {
  // ---------------------------------------------------------------
  // 1) ESTADO PRIVADO Y MODIFICABLE (convención: guion bajo "_")
  //    Solo el propio servicio puede hacer .set() / .update() sobre él.
  // ---------------------------------------------------------------
  //    Su valor inicial ya no está escrito a mano: lo RECOGEMOS de
  //    localStorage (lo que se guardó la última vez).
  private _alumnos = signal<Alumno[]>(this.cargarDeStorage());

  // ---------------------------------------------------------------
  // 2) EXPOSICIÓN PÚBLICA DE SOLO LECTURA
  //    Los componentes pueden LEER alumnos(), pero si intentan
  //    alumnos.set(...) → error de compilación. Así nadie se salta
  //    la lógica del servicio.
  // ---------------------------------------------------------------
  alumnos = this._alumnos.asReadonly();

  // ---------------------------------------------------------------
  // 3) VALORES DERIVADOS (computed) → se recalculan solos cuando
  //    cambia _alumnos. No se guardan: se calculan (estado mínimo).
  // ---------------------------------------------------------------
  total = computed(() => this._alumnos().length);

  notaMediaGeneral = computed(() => {
    const lista = this._alumnos();
    if (lista.length === 0) return 0;
    const suma = lista.reduce((acc, a) => acc + a.notaMedia, 0);
    return +(suma / lista.length).toFixed(2);
  });

  aprobados = computed(() => this._alumnos().filter(a => a.notaMedia >= 5).length);

  constructor() {
    console.log('🟢 AlumnosService creado (solo debería salir 1 vez)');

    // -------------------------------------------------------------
    // GUARDAR AUTOMÁTICO con effect()
    // Un effect se ejecuta al principio y cada vez que cambia algún
    // signal que lee dentro. Aquí lee _alumnos(), así que CADA VEZ
    // que añades, borras o cambias una nota, se guarda solo.
    // (Es el uso típico de effect que da la lección: sincronizar
    //  con algo externo como localStorage.)
    // -------------------------------------------------------------
    effect(() => {
      const lista = this._alumnos();
      localStorage.setItem(CLAVE_STORAGE, JSON.stringify(lista));
      console.log('💾 Guardados', lista.length, 'alumnos en localStorage');
    });
  }

  /**
   * RECOGER los datos guardados.
   * localStorage solo guarda TEXTO, por eso:
   *   guardar → JSON.stringify(array)  (array → texto)
   *   leer    → JSON.parse(texto)      (texto → array)
   */
  private cargarDeStorage(): Alumno[] {
    try {
      const texto = localStorage.getItem(CLAVE_STORAGE);
      return texto ? (JSON.parse(texto) as Alumno[]) : ALUMNOS_INICIALES;
    } catch {
      // Si el texto guardado está roto, empezamos con los de ejemplo.
      return ALUMNOS_INICIALES;
    }
  }

  /** Vuelve a los datos de ejemplo (útil para practicar). */
  restablecer() {
    this._alumnos.set(ALUMNOS_INICIALES);
  }

  // ---------------------------------------------------------------
  // 4) MÉTODOS PÚBLICOS: la ÚNICA forma de modificar el estado.
  //    Usamos update() porque el nuevo valor DEPENDE del anterior,
  //    y siempre devolvemos un array NUEVO (inmutabilidad):
  //      añadir   → [...lista, nuevo]
  //      eliminar → lista.filter(...)
  //    Nunca push() ni splice(): mutan el array y el signal no
  //    se entera de que algo ha cambiado.
  // ---------------------------------------------------------------

  /** Busca un alumno por id (o undefined si no existe). */
  getAlumnoById(id: number): Alumno | undefined {
    return this._alumnos().find(a => a.id === id);
  }

  /** Añade un alumno generando su id. */
  agregarAlumno(alumno: Omit<Alumno, 'id'>): Alumno {
    const lista = this._alumnos();
    const nuevo: Alumno = {
      ...alumno,
      id: lista.length ? Math.max(...lista.map(a => a.id)) + 1 : 1,
    };
    this._alumnos.update(alumnos => [...alumnos, nuevo]);
    return nuevo;
  }

  /** Elimina un alumno. Devuelve true si existía. */
  eliminarAlumno(id: number): boolean {
    const existe = this._alumnos().some(a => a.id === id);
    if (existe) {
      this._alumnos.update(alumnos => alumnos.filter(a => a.id !== id));
    }
    return existe;
  }

  /** Cambia la nota de un alumno sin tocar sus otros campos (spread). */
  cambiarNota(id: number, nuevaNota: number) {
    this._alumnos.update(alumnos =>
      alumnos.map(a => (a.id === id ? { ...a, notaMedia: nuevaNota } : a))
    );
  }
}
