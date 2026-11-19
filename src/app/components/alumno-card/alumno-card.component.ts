import { Component, input, output } from '@angular/core';
import { Alumno } from '../../models/alumno.model';

// =====================================================================
// COMPONENTE DUMB (tonto / de presentación)
//  - NO inyecta el servicio. No sabe de dónde vienen los datos.
//  - Recibe datos por input()  → los datos BAJAN del padre.
//  - Avisa con output()        → los eventos SUBEN al padre.
// =====================================================================
@Component({
  selector: 'app-alumno-card',
  templateUrl: './alumno-card.component.html',
  styleUrl: './alumno-card.component.css',
})
export class AlumnoCardComponent {
  // El padre se lo pasa así: <app-alumno-card [alumno]="a" />
  alumno = input.required<Alumno>();

  // El padre lo escucha así: (eliminar)="eliminarAlumno($event)"
  eliminar = output<number>();

  // Avisa al padre de que quiere cambiar la nota (envía id y nota nueva).
  cambiarNota = output<{ id: number; nota: number }>();

  // PASO 1 del flujo: el usuario pulsa el botón → emitimos el id hacia arriba.
  onEliminar() {
    this.eliminar.emit(this.alumno().id);
  }

  // Suma o resta 0.5 a la nota, sin pasar de 0 ni de 10.
  onCambiarNota(delta: number) {
    const nota = Math.min(10, Math.max(0, this.alumno().notaMedia + delta));
    this.cambiarNota.emit({ id: this.alumno().id, nota });
  }
}
