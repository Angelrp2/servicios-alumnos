import { Component, computed, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { PokemonBase } from '../../models/pokemon.model';

// Traducción de los tipos que da la API (en inglés) a español.
const TIPOS_ES: Record<string, string> = {
  normal: 'Normal', fire: 'Fuego', water: 'Agua', grass: 'Planta', electric: 'Eléctrico',
  ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno', ground: 'Tierra', flying: 'Volador',
  psychic: 'Psíquico', bug: 'Bicho', rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón',
  dark: 'Siniestro', steel: 'Acero', fairy: 'Hada',
};

// Valor máximo para dibujar las barras (pocas stats base pasan de 200).
const STAT_MAX = 200;

// Huecos de habilidad que reserva la carta. Debe coincidir con
// `grid-template-rows: repeat(3, ...)` de .habilidades en el CSS.
const MAX_HABILIDADES = 3;

// ---------------------------------------------------------------------
// RAREZA: la inventamos a partir de la suma de estadísticas.
// Cuanto más fuerte es el pokémon, más especial es su carta.
// Cada rareza tiene un diseño distinto en el CSS ([data-rareza]).
// ---------------------------------------------------------------------
export type Rareza = 'comun' | 'infrecuente' | 'rara' | 'holo' | 'legendaria';

const RAREZAS: { rareza: Rareza; desde: number; nombre: string; simbolo: string }[] = [
  { rareza: 'legendaria', desde: 580, nombre: 'Legendaria', simbolo: '★★' },
  { rareza: 'holo', desde: 500, nombre: 'Holo', simbolo: '★' },
  { rareza: 'rara', desde: 420, nombre: 'Rara', simbolo: '◆' },
  { rareza: 'infrecuente', desde: 330, nombre: 'Infrecuente', simbolo: '◈' },
  { rareza: 'comun', desde: 0, nombre: 'Común', simbolo: '●' },
];

// =====================================================================
// CARTA DE POKÉMON (Dumb)
// Sigue sin saber nada de HTTP: recibe un Pokemon y lo pinta.
//
// NOVEDAD: "host bindings". El bloque `host` de abajo engancha eventos
// y estilos al propio elemento <app-pokemon-card>:
//   (pointermove)  → mover(): calcula dónde está el ratón (0-100 %)
//   [style.--px]   → pasa ese valor al CSS como variable --px
// El CSS usa --px y --py para inclinar la carta en 3D y mover el brillo.
// =====================================================================
@Component({
  selector: 'app-pokemon-card',
  imports: [DecimalPipe],
  templateUrl: './pokemon-card.component.html',
  styleUrl: './pokemon-card.component.css',
  host: {
    '(pointermove)': 'mover($event)',
    '(pointerleave)': 'salir()',
    '[style.--px]': 'px()',
    '[style.--py]': 'py()',
  },
})
export class PokemonCardComponent {
  // PokemonBase: vale tanto para el catálogo como para tu colección
  // (PokemonGuardado extiende PokemonBase) → una sola carta para todo.
  pokemon = input.required<PokemonBase>();

  // ---------------- Datos derivados para la plantilla ----------------
  tipoPrincipal = computed(() => this.pokemon().tipos[0] ?? 'normal');

  // Nunca más de los huecos que tiene la carta (así la altura no cambia).
  habilidades = computed(() => {
    const p = this.pokemon();
    const lista = p.habilidades.map(nombre => ({ nombre, oculta: false }));
    if (p.habilidad_oculta) lista.push({ nombre: p.habilidad_oculta, oculta: true });
    return lista.slice(0, MAX_HABILIDADES);
  });

  tiposTraducidos = computed(() =>
    this.pokemon().tipos.map(t => ({ clave: t, nombre: TIPOS_ES[t] ?? t }))
  );

  barras = computed(() => {
    const p = this.pokemon();
    return [
      { nombre: 'Ataque', valor: p.ataque },
      { nombre: 'Defensa', valor: p.defensa },
      { nombre: 'At. esp.', valor: p.ataque_esp },
      { nombre: 'Def. esp.', valor: p.defensa_esp },
      { nombre: 'Velocidad', valor: p.velocidad },
    ].map(b => ({ ...b, porcentaje: Math.min(100, (b.valor / STAT_MAX) * 100) }));
  });

  totalStats = computed(() => {
    const p = this.pokemon();
    return p.ps + p.ataque + p.defensa + p.ataque_esp + p.defensa_esp + p.velocidad;
  });

  // La primera rareza cuyo mínimo se alcanza (la lista va de mayor a menor).
  infoRareza = computed(() => RAREZAS.find(r => this.totalStats() >= r.desde)!);

  // ---------------- Interacción con el ratón ----------------
  // Posición del ratón dentro de la carta, en % (50/50 = centro).
  px = signal(50);
  py = signal(50);
  activa = signal(false);

  mover(evento: PointerEvent) {
    const caja = (evento.currentTarget as HTMLElement).getBoundingClientRect();
    this.px.set(((evento.clientX - caja.left) / caja.width) * 100);
    this.py.set(((evento.clientY - caja.top) / caja.height) * 100);
    this.activa.set(true);
  }

  salir() {
    this.px.set(50);
    this.py.set(50);
    this.activa.set(false);
  }
}
