import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { PokemonCardComponent } from '../../components/pokemon-card/pokemon-card.component';
import { EstadoCargaComponent } from '../../components/estado-carga/estado-carga.component';
import { ValoracionComponent } from '../../components/valoracion/valoracion.component';
import { PokemonService } from '../../services/pokemon.service';
import { ColeccionService } from '../../services/coleccion.service';
import { PokemonBase } from '../../models/pokemon.model';

// =====================================================================
// POKÉDEX (Smart): catálogo de nuestra API + acciones sobre tu colección.
//
// Dos servicios inyectados, cada uno con su responsabilidad:
//   PokemonService   → LEER el catálogo (GET /api/pokeapi)
//   ColeccionService → GUARDAR y VALORAR (POST/PATCH /api/pokemons)
// =====================================================================
@Component({
  selector: 'app-pokedex-page',
  imports: [PokemonCardComponent, EstadoCargaComponent, ValoracionComponent],
  templateUrl: './pokedex-page.component.html',
  styleUrl: './pokedex-page.component.css',
})
export class PokedexPageComponent {
  private pokemonService = inject(PokemonService);
  protected coleccion = inject(ColeccionService);

  readonly POR_PAGINA = 12;

  // ---------------- ESTADO LOCAL ----------------
  pagina = signal(0);
  busqueda = signal('');

  // ---------------- DATOS REMOTOS (rxResource) ----------------
  // Cuando cambia pagina() → cambian los params → se vuelve a pedir.
  listado = rxResource({
    params: () => ({ offset: this.pagina() * this.POR_PAGINA, limit: this.POR_PAGINA }),
    stream: ({ params }) => this.pokemonService.getPagina(params.offset, params.limit),
  });

  // params undefined → no pide nada (buscador vacío).
  resultadoBusqueda = rxResource({
    params: () => this.busqueda() || undefined,
    stream: ({ params }) => this.pokemonService.buscar(params),
  });

  // ---------------- DERIVADOS ----------------
  // Un único array para la plantilla, venga del listado o de la búsqueda.
  // Así el @for de las cartas se escribe UNA vez.
  recursoActivo = computed(() => (this.busqueda() ? this.resultadoBusqueda : this.listado));

  pokemons = computed<PokemonBase[]>(() => {
    if (this.busqueda()) {
      return this.resultadoBusqueda.hasValue() ? [this.resultadoBusqueda.value()] : [];
    }
    return this.listado.hasValue() ? this.listado.value().pokemons : [];
  });

  totalPaginas = computed(() =>
    this.listado.hasValue() ? Math.ceil(this.listado.value().total / this.POR_PAGINA) : 0
  );

  // ---------------- ACCIONES ----------------
  cambiarPagina(delta: number) {
    this.pagina.update(p => Math.min(Math.max(0, p + delta), Math.max(0, this.totalPaginas() - 1)));
  }

  buscar(evento: Event, texto: string) {
    evento.preventDefault();
    this.busqueda.set(texto.trim());
  }

  limpiarBusqueda(input: HTMLInputElement) {
    input.value = '';
    this.busqueda.set('');
  }

  /** Reintenta lo que falló: el catálogo y, si también falló, tu colección. */
  reintentar() {
    this.recursoActivo().reload();
    if (this.coleccion.lista.error()) this.coleccion.lista.reload();
  }

  /** Si ya está guardado, valora; si no, lo guarda con esa valoración. */
  valorar(p: PokemonBase, valor: boolean) {
    const guardado = this.coleccion.porPokeapiId().get(p.pokeapi_id);
    if (guardado) this.coleccion.valorar(guardado, valor);
    else this.coleccion.guardar(p.pokeapi_id, valor);
  }
}
