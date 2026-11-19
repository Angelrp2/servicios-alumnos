import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../core/api.config';
import { PaginaPokemon, PokemonBase } from '../models/pokemon.model';

// =====================================================================
// CATÁLOGO: habla con NUESTRA API (/api/pokeapi), no con PokéAPI.
//
// Antes este servicio pedía la lista, luego 12 detalles con
// switchMap + forkJoin y transformaba el JSON. Todo eso lo hace ahora el
// backend (con caché), así que aquí queda una línea por método.
// =====================================================================
@Injectable({ providedIn: 'root' })
export class PokemonService {
  private http = inject(HttpClient);
  private url = `${API_URL}/pokeapi`;

  /** GET /api/pokeapi?offset=0&limit=12 */
  getPagina(offset: number, limit: number): Observable<PaginaPokemon> {
    const params = new HttpParams().set('offset', offset).set('limit', limit);
    return this.http.get<PaginaPokemon>(this.url, { params });
  }

  /** GET /api/pokeapi/pikachu */
  buscar(nombreOId: string): Observable<PokemonBase> {
    return this.http.get<PokemonBase>(`${this.url}/${encodeURIComponent(nombreOId.trim().toLowerCase())}`);
  }
}
