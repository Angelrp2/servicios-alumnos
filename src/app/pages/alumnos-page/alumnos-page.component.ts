import { Component, inject } from '@angular/core';
import { AlumnoCardComponent } from '../../components/alumno-card/alumno-card.component';
import { AlumnoFormComponent } from '../../components/alumno-form/alumno-form.component';
import { AlumnosService } from '../../services/alumnos.service';
import { Alumno } from '../../models/alumno.model';

// =====================================================================
// COMPONENTE SMART (versión 2 · con el servicio usando signals)
//
// Compáralo con apuntes/v1-alumnos-page.component.ts.txt:
//   - Ya NO tiene su propio signal de alumnos (no duplica estado).
//   - Ya NO hace this.alumnos.set(...) después de cada cambio.
//   - Ya NO necesita el "truco" dentro del computed.
//   Solo LEE los signals del servicio y LLAMA a sus métodos.
// =====================================================================
@Component({
  selector: 'app-alumnos-page',
  imports: [AlumnoCardComponent, AlumnoFormComponent],
  templateUrl: './alumnos-page.component.html',
  styleUrl: './alumnos-page.component.css',
})
export class AlumnosPageComponent {
  // INYECCIÓN: pedimos a Angular la instancia única del servicio.
  private alumnosService = inject(AlumnosService);

  // Referencias a los signals del servicio (no son copias: es el MISMO signal).
  // Son de solo lectura, así que aquí no podríamos hacer alumnos.set(...).
  alumnos = this.alumnosService.alumnos;
  total = this.alumnosService.total;
  notaMediaGeneral = this.alumnosService.notaMediaGeneral;

  // ---------------------------------------------------------------
  // FLUJO al eliminar (versión 2, más corto):
  //   PASO 1  AlumnoCard emite (eliminar) con el id
  //   PASO 2  llega aquí
  //   PASO 3  confirm(): si cancela, se corta
  //   PASO 4  el servicio hace _alumnos.update(...)
  //   PASO 5  Angular ve que el signal cambió → repinta TODO lo que lo lee
  //           (esta página, el resumen de arriba, los computed...)
  // ---------------------------------------------------------------
  eliminarAlumno(id: number) {
    if (!confirm('¿Seguro que quieres eliminar este alumno?')) {
      return;
    }
    this.alumnosService.eliminarAlumno(id);
    // ✅ Nada más. Antes aquí venía: this.alumnos.set(this.alumnosService.getAlumnos())
  }

  cambiarNota(evento: { id: number; nota: number }) {
    this.alumnosService.cambiarNota(evento.id, evento.nota);
  }

  // ---------------------------------------------------------------
  // FLUJO COMPLETO al guardar un alumno:
  //   1) RECOGER  → AlumnoForm valida y emite (guardar) con los datos
  //   2) GUARDAR  → aquí se los pasamos al servicio: agregarAlumno()
  //                 el servicio hace _alumnos.update(...) y su effect()
  //                 lo escribe en localStorage
  //   3) IMPRIMIR → el signal cambió → el @for vuelve a pintar la lista
  //   Al recargar la página, el servicio RECOGE de localStorage lo guardado.
  // ---------------------------------------------------------------
  guardarAlumno(datos: Omit<Alumno, 'id'>) {
    const nuevo = this.alumnosService.agregarAlumno(datos);
    console.log('✅ Alumno guardado con id', nuevo.id);
  }

  restablecer() {
    if (confirm('¿Borrar todo y volver a los datos de ejemplo?')) {
      this.alumnosService.restablecer();
    }
  }
}
