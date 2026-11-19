import { Component, input, output } from '@angular/core';
import { Valoracion } from '../../models/pokemon.model';

// =====================================================================
// BOTONES "ME GUSTA / NO ME GUSTA" (reutilizable, Dumb)
// Se usa en la Pokédex y en Mi colección. No sabe nada de la API:
// recibe la valoración actual y emite lo que pulsa el usuario.
// =====================================================================
@Component({
  selector: 'app-valoracion',
  template: `
    <div class="valoracion" role="group" aria-label="Valoración">
      <button
        class="btn btn-sm"
        [class.activo]="valor() === true"
        [disabled]="ocupado()"
        [attr.aria-pressed]="valor() === true"
        (click)="cambiar.emit(true)"
        title="Me gusta"
      >👍 Me gusta</button>
      <button
        class="btn btn-sm"
        [class.activo]="valor() === false"
        [disabled]="ocupado()"
        [attr.aria-pressed]="valor() === false"
        (click)="cambiar.emit(false)"
        title="No me gusta"
      >👎 No</button>
    </div>
  `,
  styles: `
    .valoracion { display: flex; gap: 6px; }
    .btn { background: #fff; color: var(--color-texto); border-color: var(--color-borde); }
    .btn.activo:first-child { background: var(--color-exito); color: #fff; border-color: transparent; }
    .btn.activo:last-child { background: var(--color-primario); color: #fff; border-color: transparent; }
  `,
})
export class ValoracionComponent {
  valor = input<Valoracion>(null);
  ocupado = input(false);
  cambiar = output<boolean>();
}
