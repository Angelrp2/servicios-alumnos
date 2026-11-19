# Guía del proyecto `servicios-alumnos`

Esta guía explica **todo lo que hay en el proyecto**, en el orden en que se construyó, y **cómo depurar cada parte**.
Léela con el código abierto al lado: cada sección dice qué archivo mirar.

---

## 0. Mapa del proyecto

```
src/app/
├── app.ts                      ← componente raíz: botones Alumnos / Pokédex
├── app.config.ts               ← providers globales (aquí se activa HttpClient)
├── models/
│   ├── alumno.model.ts         ← forma de un Alumno
│   └── pokemon.model.ts        ← forma de lo que da la API + nuestro Pokemon
├── services/
│   ├── alumnos.service.ts      ← datos de alumnos (signals + localStorage)
│   └── pokemon.service.ts      ← peticiones HTTP a PokeAPI (RxJS)
├── pages/                      ← componentes SMART (hablan con servicios)
│   ├── alumnos-page/
│   └── pokedex-page/           ← usa rxResource
└── components/                 ← componentes DUMB (solo pintan)
    ├── alumno-card/
    ├── alumno-form/
    ├── resumen/                ← (excepción: inyecta el servicio para demostrar estado compartido)
    └── pokemon-card/
apuntes/
├── v1-*.txt                    ← versión 1 sin signals en el servicio (para comparar)
└── GUIA.md                     ← este archivo
```

**Regla de oro de todo el proyecto:**
> Los datos viven en un **servicio**. Las **páginas** (Smart) piden datos al servicio. Las **tarjetas** (Dumb) solo reciben datos por `input()` y avisan con `output()`.

---

## 1. Servicios e inyección de dependencias

📄 `services/alumnos.service.ts`, `pages/alumnos-page/alumnos-page.component.ts`

| Concepto | Qué significa | Dónde verlo |
|---|---|---|
| `@Injectable({ providedIn: 'root' })` | Angular crea **una sola instancia** (singleton) para toda la app | primera línea del servicio |
| `inject(AlumnosService)` | **Pedir** esa instancia a Angular (no hacer `new`) | `private alumnosService = inject(...)` en la página |
| Fuente única de verdad | Los datos solo existen en el servicio; los componentes los leen | `private _alumnos` |

**🐞 Depurar:**
- En la consola sale `🟢 AlumnosService creado` **una vez**. Si saliera dos veces → alguien lo tiene en `providers: [...]` de un componente (crea otra instancia).
- `NullInjectorError: No provider for X` → falta `providedIn: 'root'` (o `provideHttpClient()` si X es `HttpClient`).

---

## 2. Signals en el servicio

📄 `services/alumnos.service.ts`

```ts
private _alumnos = signal<Alumno[]>(...);   // 1. privado y modificable
alumnos = this._alumnos.asReadonly();       // 2. público, solo lectura
total = computed(() => this._alumnos().length); // 3. derivados
agregarAlumno(a) { this._alumnos.update(l => [...l, nuevo]); } // 4. métodos
```

- `set(valor)` → reemplaza. `update(fn)` → calcula el nuevo a partir del anterior.
- **Inmutabilidad**: siempre un array/objeto NUEVO (`[...l, x]`, `filter`, `map`, `{...a, campo}`). Nunca `push`/`splice`: el signal no se entera.
- `computed` se recalcula **solo** cuando cambia un signal que lee dentro.

**🐞 Depurar:**
- Si la pantalla no se actualiza → busca un `push`, `splice` o `obj.campo = x` sobre datos de un signal.
- Pon un `console.log` dentro de un `computed` para ver cuándo se recalcula.

---

## 3. Recoger → guardar → mostrar (localStorage)

📄 `components/alumno-form/`, `pages/alumnos-page/`, `services/alumnos.service.ts`

```
AlumnoForm ──(guardar)──▶ AlumnosPage.guardarAlumno() ──▶ servicio.agregarAlumno()
                                                              │ _alumnos.update()
                                    ┌─────────────────────────┴───────────────┐
                                    ▼                                         ▼
                         @for repinta la lista                effect() → localStorage.setItem()
```

- `localStorage` solo guarda **texto** → `JSON.stringify` al guardar, `JSON.parse` al leer.
- `effect()` se ejecuta cada vez que cambia `_alumnos()` → guardado automático.
- Al arrancar, `cargarDeStorage()` recoge lo guardado.

**🐞 Depurar:**
- F12 → **Application → Local Storage → localhost:4200** → clave `alumnos`. Puedes editarla o borrarla a mano y recargar.
- En consola: `💾 Guardados N alumnos`.

---

## 4. Pokédex: API + RxJS + rxResource

> ⚠️ **Actualización:** la Pokédex ya no llama a PokéAPI desde Angular: ahora pasa por **tu propia API** (FastAPI + SQLite) y tiene CRUD y "me gusta".
> Lee **[ARQUITECTURA.md](ARQUITECTURA.md)** para el esquema completo, HTTP, el backend y la refactorización.
> Lo de las secciones 4.1–4.4 (rxResource, operadores RxJS) sigue siendo válido como concepto: la cadena `switchMap + forkJoin` ahora vive en el backend (`asyncio.gather`).


### 4.1 Activar HttpClient
📄 `app.config.ts` → `provideHttpClient(withFetch())`.
Sin esto, `inject(HttpClient)` da `NullInjectorError`.

### 4.2 Dos modelos
📄 `models/pokemon.model.ts`
- `PokeApi...Response` = cómo llegan los datos (forma de PokeAPI, en inglés).
- `Pokemon` = cómo los usamos nosotros (limpio, en español).
- El servicio transforma uno en otro en `aPokemon()`. Si la API cambia, **solo se toca el servicio**.

### 4.3 El servicio con RxJS
📄 `services/pokemon.service.ts` → `getPagina(offset, limit)`

PokeAPI obliga a dos pasos (la lista no trae imágenes):

```
http.get(lista)                       ① pide 12 nombres
  .pipe(
    tap(...)                          ② log: "llega la lista"
    switchMap(lista =>                   con la lista, lanza OTRAS peticiones:
      forkJoin(12 × http.get(detalle))   las 12 a la vez, espera a TODAS
        .pipe(map(→ Pokemon[]))       ③ transforma a nuestro modelo
    ),
    tap(...)                          ④ log: "página lista"
  )
```

| Operador | Para qué | Frase para recordarlo |
|---|---|---|
| `pipe()` | encadenar operadores | "tubería" |
| `tap()` | mirar sin modificar (logs) | "echar un vistazo" |
| `map()` | transformar el dato | "convierte A en B" |
| `switchMap()` | con un resultado, lanzar otro Observable | "y luego pide esto otro" |
| `forkJoin()` | lanzar varias a la vez y esperar a todas | "espera a que lleguen todas" |
| `of()` | crear un Observable con un valor ya conocido | "devuelve esto tal cual" |

**Un Observable no hace nada hasta que alguien se suscribe.** Aquí no hacemos `subscribe()`: lo hace `rxResource`.

### 4.4 rxResource en la página
📄 `pages/pokedex-page/pokedex-page.component.ts`

```ts
pagina = signal(0);

listado = rxResource({
  params: () => ({ offset: this.pagina() * 12, limit: 12 }),   // QUÉ pedir
  stream: ({ params }) => this.pokemonService.getPagina(params.offset, params.limit), // CÓMO pedirlo
});
```

- Cuando `pagina()` cambia → `params` cambia → rxResource **cancela** la petición anterior y llama a `stream` otra vez.
- Los botones solo hacen `pagina.update(p => p + 1)`. **No llaman al servicio**: el resource reacciona solo.
- Si `params` devuelve `undefined` → no pide nada (status `idle`). Así funciona el buscador vacío.

Lo que te da el resource (todo son signals):

| Signal | Valor |
|---|---|
| `status()` | `'idle'` · `'loading'` · `'reloading'` · `'resolved'` · `'error'` · `'local'` |
| `isLoading()` | `true` mientras carga |
| `error()` | el error, o `undefined` |
| `hasValue()` | `true` si hay datos |
| `value()` | los datos. ⚠️ **Lanza excepción si está en error** → comprobar `error()`/`hasValue()` antes |
| `reload()` | repetir la petición con los mismos params (botón "Reintentar") |

En la plantilla, **siempre** los 3 estados y en este orden:

```html
@if (listado.isLoading()) { esqueletos }
@else if (listado.error()) { mensaje + Reintentar }
@else if (listado.hasValue()) { @for tarjetas }
```

**🐞 Depurar la Pokédex (de fuera hacia dentro):**
1. **Panel de depuración** (abajo de la página): ves `status`, `isLoading`, `params` y `error` cambiando en vivo.
2. **Consola**: logs `[PokemonService] ① ② ③ ④`. Si te quedas en ① → la petición falla o no llega. Si llegas a ② pero no a ③ → falla algún detalle. Pon `DEBUG = false` para silenciarlos.
3. **F12 → Network (Red)**: filtra por `pokeapi`. Verás 1 petición de lista + 12 de detalle por página. Pincha una → **Response** para ver el JSON real que llega.
4. **Breakpoints**: F12 → **Sources** → `Ctrl+P` → `pokemon.service.ts` → clic en el número de línea de `aPokemon`. Al pasar de página se para ahí y puedes inspeccionar `d`.
5. **Simular errores**: en Network marca **Offline** y pulsa "Siguiente" → debe salir el bloque rojo con "Reintentar". Quita Offline y pulsa Reintentar.
6. **Angular DevTools** (extensión de Chrome): pestaña Components → selecciona `app-pokedex-page` y verás sus signals.

### 4.5 La carta: rarezas, efecto 3D y CSS por capas
📄 `components/pokemon-card/`

**Rareza** (`pokemon-card.component.ts`): se calcula con un `computed` a partir de la suma de las 6 estadísticas.

| Rareza | Total stats | Aspecto |
|---|---|---|
| ● Común | < 330 | marco plateado |
| ◈ Infrecuente | 330–419 | plata + filo del color del tipo |
| ◆ Rara | 420–499 | marco dorado + rayos + brillo suave |
| ★ Holo | 500–579 | dorado + lámina arcoíris + ventana holográfica que gira |
| ★★ Legendaria | ≥ 580 | carta oscura, marco arcoíris animado, estrellas, imagen con resplandor |

Para ver cada una: Bulbasaur (común), Ivysaur (infrecuente), Raichu (rara), Venusaur (holo), Mewtwo (legendaria).

**Host bindings** (bloque `host` del `@Component`): enganchan eventos y estilos al propio `<app-pokemon-card>`.

```ts
host: {
  '(pointermove)': 'mover($event)',   // al mover el ratón → calcula px/py (0-100)
  '(pointerleave)': 'salir()',        // al salir → vuelve al centro
  '[style.--px]': 'px()',             // signal → variable CSS
  '[style.--py]': 'py()',
}
```

**El CSS va por capas y variables**, de abajo a arriba:
`.carta` (marco) → `.interior` (contenido con `--patron`) → `.holo` (arcoíris) → `.destellos` (estrellas) → `.brillo` (reflejo).

- `[data-tipo='fire']` define `--c`, `--c-claro`, `--c-oscuro` y `--patron` → **un tipo = una línea** para cambiar su color o su dibujo.
- `[data-rareza='holo']` cambia `--marco`, `--holo-opacidad`… → **una rareza = un bloque**.
- La inclinación usa `calc((var(--px) - 50) * 0.28deg)`: en el centro da 0°.

**🐞 Depurar la carta:**
- F12 → Elements → selecciona un `<app-pokemon-card>`: verás `style="--px: 63.2; --py: 41"` cambiando al mover el ratón.
- Selecciona la `.carta` → en Styles busca `--c`, `--marco`… y cámbialos en vivo para probar colores.
- Si un efecto "lava" los colores: baja `--holo-opacidad` de esa rareza.

**Por qué todas las cartas miden igual (buenas prácticas de layout):**
1. **Tamaño fijo**: `.carta` tiene `aspect-ratio: 63 / 88` y NO crece con el contenido.
2. **Unidades relativas al contenedor**: `:host { container-type: inline-size }` y `.carta { font-size: 4.2cqi }` → 1em = 4,2 % del ancho de la carta. Todo lo demás va en `em`, así que la carta se ve idéntica en móvil, tablet o escritorio (solo cambia de tamaño).
3. **Filas fijas con grid**: cada sección tiene altura fija; la imagen usa `minmax(0, 1fr)` y se queda con el espacio sobrante (el `0` evita que la imagen empuje la fila).
4. **El contenido variable nunca cambia la altura**:
   - habilidades: siempre 3 huecos (`repeat(3, 1.5em)`) y el `.ts` corta con `slice(0, MAX_HABILIDADES)`;
   - textos de una línea con `white-space: nowrap` + `text-overflow: ellipsis` ("…") y `title` para ver el texto completo al pasar el ratón;
   - la imagen va con `position: absolute` + `object-fit: contain`: se adapta al hueco sin cambiarlo.
5. **Las rarezas solo cambian colores y efectos, nunca tamaños**.

Comprobación rápida en la consola (F12), todas deberían dar 1.397:
```js
[...document.querySelectorAll('.carta')].map(c => (c.offsetHeight / c.offsetWidth).toFixed(3))
```

---

## 5. Errores típicos y su causa

| Síntoma | Causa probable | Dónde mirar |
|---|---|---|
| `NullInjectorError: No provider for HttpClient` | falta `provideHttpClient()` | `app.config.ts` |
| `NullInjectorError: No provider for XService` | falta `providedIn: 'root'` | el servicio |
| La lista no se actualiza al añadir/borrar | mutación (`push`, `splice`) | métodos del servicio |
| Error en consola al leer `value()` | el resource está en error | usar `hasValue()` / `error()` primero |
| Tarjeta sin imagen o datos raros | la transformación A → B | `aPokemon()` en el servicio |
| No se ven los cambios al guardar archivo | el watcher de OneDrive no detecta cambios | `Ctrl+C` y `npx ng serve` otra vez |
| 404 en la búsqueda | el nombre no existe (PokeAPI usa minúsculas en inglés) | Network → la URL pedida |

---

## 6. Ejercicios para mejorarlo (de fácil a difícil)

1. Cambia `POR_PAGINA` a 20. ¿Qué tienes que tocar? (Solo una línea.)
2. Añade a la carta el **color de la barra según el valor** (rojo < 50, amarillo < 90, verde ≥ 90). Pista: amplía el `computed` `barras` en `pokemon-card.component.ts` con un campo `color` y úsalo con `[style.background]`.
3. Haz que pulsar una tarjeta emita un `output()` y la página muestre el detalle de ese pokémon.
4. Guarda en `localStorage` la página en la que estabas (pista: `effect()` como en alumnos) y recupérala al recargar.
5. Haz que la búsqueda funcione mientras escribes (pista: un signal actualizado en `(input)`; investiga `debounceTime` o `toObservable`).
6. Prueba `httpResource` (Angular 21) en vez de `rxResource` para la búsqueda: hace la petición sin escribir el servicio con `HttpClient`. Compara ventajas e inconvenientes.

---

## 7. Arrancar el proyecto

```bash
cd "C:\Users\AlumnoM\OneDrive - Digitech\Escritorio\angular\servicios-alumnos"
npx ng serve
```

Abre http://localhost:4200
