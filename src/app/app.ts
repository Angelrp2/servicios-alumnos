import { Component, inject, signal } from '@angular/core';
import { AlumnosPageComponent } from './pages/alumnos-page/alumnos-page.component';
import { ResumenComponent } from './components/resumen/resumen.component';
import { PokedexPageComponent } from './pages/pokedex-page/pokedex-page.component';
import { ColeccionPageComponent } from './pages/coleccion-page/coleccion-page.component';
import { ColeccionService } from './services/coleccion.service';

type Vista = 'pokedex' | 'coleccion' | 'alumnos';

// Componente raíz. Cambiamos de pantalla con un signal y @switch
// (todavía sin Router: es la lección siguiente del curso).
@Component({
  selector: 'app-root',
  imports: [AlumnosPageComponent, ResumenComponent, PokedexPageComponent, ColeccionPageComponent],
  template: `
    <nav>
      @for (v of vistas; track v.clave) {
        <button class="btn btn-sm" [class.btn-borde]="vista() !== v.clave" (click)="vista.set(v.clave)">
          {{ v.etiqueta }}
          @if (v.clave === 'coleccion') { ({{ coleccion.total() }}) }
        </button>
      }
    </nav>

    @switch (vista()) {
      @case ('pokedex') { <app-pokedex-page /> }
      @case ('coleccion') { <app-coleccion-page /> }
      @case ('alumnos') { <app-resumen /> <app-alumnos-page /> }
    }
  `,
  styles: `
    nav {
      display: flex;
      gap: 8px;
      padding: 10px 16px;
      background: var(--color-fondo-suave);
      border-bottom: 1px solid var(--color-borde);
    }
    nav .btn:not(.btn-borde) {
      background: var(--color-texto);
    }
  `,
})
export class App {
  protected coleccion = inject(ColeccionService);

  protected readonly vistas: { clave: Vista; etiqueta: string }[] = [
    { clave: 'pokedex', etiqueta: 'Pokédex' },
    { clave: 'coleccion', etiqueta: 'Mi colección' },
    { clave: 'alumnos', etiqueta: 'Alumnos' },
  ];

  vista = signal<Vista>('pokedex');
}
