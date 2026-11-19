import { Component, input, output } from '@angular/core';
import { mensajeError } from '../../core/errores';

// =====================================================================
// ESTADO DE CARGA (reutilizable)
// Los datos remotos SIEMPRE tienen 3 estados: cargando / error / datos.
// Antes cada pantalla repetía el mismo @if...@else. Ahora:
//
//   <app-estado-carga [cargando]="r.isLoading()" [error]="r.error()" (reintentar)="r.reload()">
//     ...aquí lo que se ve cuando hay datos...
//   </app-estado-carga>
//
// <ng-content> = "proyección de contenido": pinta lo que el padre pone dentro.
// =====================================================================
@Component({
  selector: 'app-estado-carga',
  template: `
    @if (cargando()) {
      <div class="grid-cartas" aria-busy="true">
        @for (i of esqueletos(); track i) {
          <div class="esqueleto"></div>
        }
      </div>
    } @else if (error()) {
      <div class="estado estado-error" role="alert">
        <p>{{ mensaje(error()) }}</p>
        <button class="btn" (click)="reintentar.emit()">Reintentar</button>
      </div>
    } @else {
      <ng-content />
    }
  `,
})
export class EstadoCargaComponent {
  cargando = input(false);
  error = input<unknown>(undefined);
  /** Cuántos huecos grises mostrar mientras carga. */
  huecos = input(12);
  reintentar = output<void>();

  protected esqueletos = () => Array.from({ length: this.huecos() }, (_, i) => i);
  protected mensaje = mensajeError;
}
