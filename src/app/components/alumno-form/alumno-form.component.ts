import { Component, computed, output, signal } from '@angular/core';
import { Alumno } from '../../models/alumno.model';

// =====================================================================
// FORMULARIO (componente Dumb): RECOGE los datos del alumno.
//  - Cada campo es un signal (estado LOCAL: solo le importa al formulario).
//  - NO inyecta el servicio: cuando los datos son válidos, los EMITE
//    hacia arriba con output() y la página se encarga de guardarlos.
// =====================================================================
@Component({
  selector: 'app-alumno-form',
  templateUrl: './alumno-form.component.html',
  styleUrl: './alumno-form.component.css',
})
export class AlumnoFormComponent {
  // Evento que sale del formulario con un alumno SIN id (el id lo pone el servicio).
  guardar = output<Omit<Alumno, 'id'>>();

  // ---- Campos del formulario (estado local) ----
  nombre = signal('');
  apellidos = signal('');
  email = signal('');
  curso = signal('1º DAM');
  nota = signal('');

  // Se pone a true al pulsar "Guardar" para empezar a enseñar errores.
  intentado = signal(false);

  // ---- Validación con computed (se recalcula sola al escribir) ----
  errores = computed(() => {
    const e: Record<string, string> = {};
    if (!this.nombre().trim()) e['nombre'] = 'Escribe el nombre';
    if (!this.apellidos().trim()) e['apellidos'] = 'Escribe los apellidos';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this.email())) e['email'] = 'Email no válido';
    const n = Number(this.nota());
    if (this.nota() === '' || isNaN(n) || n < 0 || n > 10) e['nota'] = 'Nota entre 0 y 10';
    return e;
  });

  esValido = computed(() => Object.keys(this.errores()).length === 0);

  // Lee el texto de un <input> o <select> cuando el usuario escribe.
  valor(evento: Event): string {
    return (evento.target as HTMLInputElement).value;
  }

  // PASO 1: el usuario pulsa "Guardar".
  enviar(evento: Event) {
    evento.preventDefault(); // que el navegador no recargue la página
    this.intentado.set(true);

    if (!this.esValido()) {
      return; // hay errores → el flujo se corta aquí
    }

    // PASO 2: emitimos los datos recogidos hacia la página.
    this.guardar.emit({
      nombre: this.nombre().trim(),
      apellidos: this.apellidos().trim(),
      email: this.email().trim(),
      curso: this.curso(),
      notaMedia: Number(this.nota()),
    });

    this.limpiar();
  }

  limpiar() {
    this.nombre.set('');
    this.apellidos.set('');
    this.email.set('');
    this.curso.set('1º DAM');
    this.nota.set('');
    this.intentado.set(false);
  }
}
