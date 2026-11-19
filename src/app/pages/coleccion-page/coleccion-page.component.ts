import { Component, computed, inject, signal } from '@angular/core';
import { PokemonCardComponent } from '../../components/pokemon-card/pokemon-card.component';
import { EstadoCargaComponent } from '../../components/estado-carga/estado-carga.component';
import { ValoracionComponent } from '../../components/valoracion/valoracion.component';
import { ColeccionService } from '../../services/coleccion.service';
import { PokemonGuardado, Valoracion } from '../../models/pokemon.model';

type Filtro = 'todos' | 'me-gusta' | 'no-me-gusta' | 'sin-valorar';

// Cada filtro = una etiqueta + una función. Añadir uno nuevo = una línea.
const FILTROS: { clave: Filtro; etiqueta: string; cumple: (v: Valoracion) => boolean }[] = [
  { clave: 'todos', etiqueta: 'Todos', cumple: () => true },
  { clave: 'me-gusta', etiqueta: '👍 Me gusta', cumple: v => v === true },
  { clave: 'no-me-gusta', etiqueta: '👎 No me gusta', cumple: v => v === false },
  { clave: 'sin-valorar', etiqueta: 'Sin valorar', cumple: v => v === null },
];

// =====================================================================
// MI COLECCIÓN (Smart): el CRUD completo sobre la base de datos.
//   READ   → coleccion.lista (se cargó al arrancar)
//   UPDATE → valorar / cambiar apodo
//   DELETE → borrar
//   (CREATE se hace desde la Pokédex con "＋ Guardar")
// Filtrar se hace EN LOCAL con un computed: no hace falta volver a pedir.
// =====================================================================
@Component({
  selector: 'app-coleccion-page',
  imports: [PokemonCardComponent, EstadoCargaComponent, ValoracionComponent],
  templateUrl: './coleccion-page.component.html',
  styleUrl: './coleccion-page.component.css',
})
export class ColeccionPageComponent {
  protected coleccion = inject(ColeccionService);
  protected readonly filtros = FILTROS;

  filtro = signal<Filtro>('todos');

  private todos = computed(() => (this.coleccion.lista.hasValue() ? this.coleccion.lista.value() : []));

  /** Cuántos hay en cada filtro (para los contadores de los botones). */
  contadores = computed(() => {
    const lista = this.todos();
    return Object.fromEntries(FILTROS.map(f => [f.clave, lista.filter(p => f.cumple(p.me_gusta)).length])) as Record<Filtro, number>;
  });

  visibles = computed(() => {
    const { cumple } = FILTROS.find(f => f.clave === this.filtro())!;
    return this.todos().filter(p => cumple(p.me_gusta));
  });

  guardarApodo(p: PokemonGuardado, texto: string) {
    const apodo = texto.trim() || null;
    if (apodo !== p.apodo) this.coleccion.actualizar(p, { apodo });
  }

  borrar(p: PokemonGuardado) {
    if (confirm(`¿Quitar a ${p.apodo ?? p.nombre} de tu colección?`)) this.coleccion.borrar(p);
  }
}
