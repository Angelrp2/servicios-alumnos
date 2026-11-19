// =====================================================================
// MODELOS DE POKÉMON = el "contrato" con NUESTRA API (pokedex-api)
//
// Los nombres de campo son EXACTAMENTE los del backend (app/models.py).
// Por eso Angular ya no transforma nada: lo que llega se usa tal cual.
// (Antes, al hablar directo con PokéAPI, había que convertir su JSON;
//  ahora esa conversión la hace el backend, en un único sitio.)
//
//   PokemonBase      ← datos del pokémon (catálogo)
//     └ PokemonGuardado ← + datos de TU colección (id, apodo, me_gusta...)
// =====================================================================

export interface PokemonBase {
  pokeapi_id: number;
  nombre: string;
  imagen: string;
  tipos: string[];
  habilidades: string[];
  habilidad_oculta: string | null;
  altura: number; // metros
  peso: number; // kilos
  experiencia: number;
  ps: number;
  ataque: number;
  defensa: number;
  ataque_esp: number;
  defensa_esp: number;
  velocidad: number;
}

/** null = sin catalogar · true = me gusta · false = no me gusta */
export type Valoracion = boolean | null;

export interface PokemonGuardado extends PokemonBase {
  id: number;
  apodo: string | null;
  me_gusta: Valoracion;
  notas: string | null;
  creado_en: string;
}

/** GET /api/pokeapi?offset&limit */
export interface PaginaPokemon {
  total: number;
  pokemons: PokemonBase[];
}

/** PATCH /api/pokemons/{id} → todo opcional (solo se envía lo que cambia) */
export type PokemonActualizar = Partial<Pick<PokemonGuardado, 'apodo' | 'me_gusta' | 'notas'>>;
