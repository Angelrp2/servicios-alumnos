import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { API_URL } from '../core/api.config';
import { mensajeError } from '../core/errores';
import { PokemonActualizar, PokemonGuardado, Valoracion } from '../models/pokemon.model';

// =====================================================================
// MI COLECCIÓN: CRUD contra /api/pokemons (base de datos SQLite).
//
// Es el mismo patrón que AlumnosService, pero los datos viven en el
// servidor en vez de en localStorage:
//
//   lista (rxResource)   → se carga UNA vez al arrancar (GET)
//   guardar/actualizar/borrar → llaman a la API y, si va bien, actualizan
//                               la lista EN LOCAL con la respuesta.
//                               No se vuelve a pedir toda la lista: eficiente.
//
// Al ser un servicio (singleton), Pokédex y Mi colección comparten estos
// datos: si das "me gusta" en una pantalla, la otra lo ve al momento.
// =====================================================================
@Injectable({ providedIn: 'root' })
export class ColeccionService {
  private http = inject(HttpClient);
  private url = `${API_URL}/pokemons`;

  // ---------------- ESTADO ----------------
  /** READ: la lista completa. Sin params → se pide una sola vez. */
  readonly lista = rxResource({
    stream: () => this.http.get<PokemonGuardado[]>(this.url),
    defaultValue: [],
  });

  /** Último error de una operación (guardar, borrar...). */
  readonly errorOperacion = signal<string | null>(null);

  /** pokeapi_id de las operaciones en curso (para desactivar botones). */
  private readonly _enCurso = signal<ReadonlySet<number>>(new Set());

  // ---------------- DERIVADOS ----------------
  /** Búsqueda rápida "¿este pokémon de la Pokédex está guardado?" (O(1)). */
  readonly porPokeapiId = computed(() => {
    const lista = this.lista.hasValue() ? this.lista.value() : [];
    return new Map(lista.map(p => [p.pokeapi_id, p]));
  });

  readonly total = computed(() => this.porPokeapiId().size);

  enCurso(pokeapiId: number): boolean {
    return this._enCurso().has(pokeapiId);
  }

  // ---------------- CRUD ----------------
  /** CREATE: POST /api/pokemons  { pokeapi_id } */
  guardar(pokeapiId: number, meGusta: Valoracion = null) {
    this.ejecutar(
      pokeapiId,
      this.http.post<PokemonGuardado>(this.url, { pokeapi_id: pokeapiId, me_gusta: meGusta }),
      nuevo => this.lista.update(l => [...l, nuevo].sort((a, b) => a.pokeapi_id - b.pokeapi_id))
    );
  }

  /** UPDATE: PATCH /api/pokemons/{id}  (solo los campos que cambian) */
  actualizar(pokemon: PokemonGuardado, cambios: PokemonActualizar) {
    this.ejecutar(
      pokemon.pokeapi_id,
      this.http.patch<PokemonGuardado>(`${this.url}/${pokemon.id}`, cambios),
      editado => this.lista.update(l => l.map(p => (p.id === editado.id ? editado : p)))
    );
  }

  /** "Me gusta" es solo un UPDATE. Pulsar la misma opción otra vez la quita. */
  valorar(pokemon: PokemonGuardado, valor: boolean) {
    this.actualizar(pokemon, { me_gusta: pokemon.me_gusta === valor ? null : valor });
  }

  /** DELETE: DELETE /api/pokemons/{id} */
  borrar(pokemon: PokemonGuardado) {
    this.ejecutar(pokemon.pokeapi_id, this.http.delete<void>(`${this.url}/${pokemon.id}`), () =>
      this.lista.update(l => l.filter(p => p.id !== pokemon.id))
    );
  }

  // ---------------- PRIVADO ----------------
  /**
   * Lo común a guardar/actualizar/borrar, escrito UNA vez:
   * marcar "en curso" → suscribirse → si va bien, aplicar cambio local →
   * si falla, guardar el mensaje → al final, quitar "en curso".
   */
  private ejecutar<T>(pokeapiId: number, peticion: Observable<T>, alTerminar: (respuesta: T) => void) {
    this.errorOperacion.set(null);
    this.marcar(pokeapiId, true);
    peticion.subscribe({
      next: respuesta => alTerminar(respuesta),
      error: err => {
        this.errorOperacion.set(mensajeError(err));
        this.marcar(pokeapiId, false);
      },
      complete: () => this.marcar(pokeapiId, false),
    });
  }

  private marcar(pokeapiId: number, activo: boolean) {
    this._enCurso.update(actual => {
      const copia = new Set(actual); // inmutable: nuevo Set → el signal se entera
      if (activo) copia.add(pokeapiId);
      else copia.delete(pokeapiId);
      return copia;
    });
  }
}
