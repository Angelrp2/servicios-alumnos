# Arquitectura: frontend → API propia → PokéAPI + base de datos

## 1. La foto completa

```
┌──────────────────────┐   HTTP (JSON)   ┌─────────────────────────┐   HTTPS (JSON)   ┌───────────┐
│  FRONTEND  Angular   │ ──────────────▶ │  BACKEND  FastAPI       │ ───────────────▶ │  PokéAPI  │
│  localhost:4200      │ ◀────────────── │  localhost:8000         │ ◀─────────────── │ (externa) │
│  servicios-alumnos/  │                 │  pokedex-api/           │                  └───────────┘
└──────────────────────┘                 │        │ SQL            │
                                         │        ▼                │
                                         │  SQLite: pokedex.db     │  ← tu colección y tus "me gusta"
                                         └─────────────────────────┘
```

| Capa | Qué hace | Carpeta |
|---|---|---|
| **Frontend** | Pinta y recoge clics. No sabe que existe PokéAPI ni la BD. | `angular/servicios-alumnos` |
| **Backend (tu API)** | Reglas y datos: pide a PokéAPI, guarda en la BD, valida. | `angular/pokedex-api` |
| **Base de datos** | Guarda lo que es TUYO (colección, apodos, valoraciones). | `pokedex-api/pokedex.db` |
| **PokéAPI** | Proveedor externo de datos (como mañana lo sería Odoo). | internet |

**¿Por qué no llamar a PokéAPI directamente desde Angular, como antes?**
- La BD no puede estar en el navegador: necesitas un servidor.
- El backend **valida**: el frontend solo manda `{ "pokeapi_id": 25 }` y es el backend el que pide los datos reales. Nadie puede guardar un Pikachu con 999 de ataque.
- **Caché**: el backend recuerda los pokémon ya pedidos. La 2.ª vez la página tarda unos ms en vez de 1 s.
- **Cambiar de proveedor sin tocar el frontend**: si mañana los productos vienen de **Odoo**, solo cambia `pokeapi.py`.

---

## 2. HTTP en 5 minutos

Cada clic que necesita datos es una **petición** (request) y una **respuesta** (response):

```
PETICIÓN  (Angular → API)                  RESPUESTA  (API → Angular)
PATCH /api/pokemons/3 HTTP/1.1             HTTP/1.1 200 OK
Content-Type: application/json             Content-Type: application/json
                                           
{"me_gusta": true}                         {"id": 3, "nombre": "charmander", "me_gusta": true, ...}
```

**Métodos = qué quieres hacer (CRUD):**

| Método | CRUD | Ejemplo | Código de respuesta si va bien |
|---|---|---|---|
| `GET` | Read | `GET /api/pokemons` | 200 OK |
| `POST` | Create | `POST /api/pokemons` + `{"pokeapi_id": 25}` | 201 Created |
| `PATCH` | Update (parcial) | `PATCH /api/pokemons/3` + `{"apodo": "Pika"}` | 200 OK |
| `DELETE` | Delete | `DELETE /api/pokemons/3` | 204 No Content |

**Códigos de estado que vas a ver:**

| Código | Significa | En este proyecto |
|---|---|---|
| 200 / 201 / 204 | Todo bien | — |
| 404 | No existe | buscar "noexiste123", borrar algo ya borrado |
| 409 | Conflicto | guardar un pokémon que ya tienes |
| 422 | Datos mal enviados | mandar `pokeapi_id: "hola"` (FastAPI valida solo) |
| 0 | ¡Ni siquiera hubo respuesta! | la API está apagada → "No se puede conectar con la API" |

**HTTP vs HTTPS:** es el mismo protocolo, pero HTTPS va **cifrado** (TLS). Entre tu navegador y tu API en `localhost` usamos HTTP porque no sale de tu ordenador. Tu API habla con PokéAPI por **HTTPS** porque va por internet. En producción (una tienda online), **todo** debe ir por HTTPS.

**CORS:** el navegador **bloquea** que una web (`localhost:4200`) llame a otro origen (`localhost:8000`) salvo que el servidor lo permita. Por eso `main.py` tiene `CORSMiddleware` con `allow_origins=["http://localhost:4200"]`. Si quitas esa línea, verás en consola un error rojo de CORS aunque la API funcione con curl.

---

## 3. El backend por dentro (`pokedex-api/app/`)

```
main.py           ← arranca la app, CORS, registra las rutas, crea las tablas
database.py       ← conexión a SQLite y una sesión por petición
models.py         ← modelos (tabla + validación) con HERENCIA para no repetir campos
pokeapi.py        ← ÚNICO sitio que conoce PokéAPI (+ caché + peticiones en paralelo)
routers/
  pokeapi_router.py   ← /api/pokeapi   (catálogo, solo lectura)
  pokemons_router.py  ← /api/pokemons  (tu colección: CRUD)
```

**Recorrido de "👍 Me gusta" en un pokémon NO guardado:**
```
1. Clic en 👍                        → ValoracionComponent emite (cambiar)=true
2. PokedexPage.valorar()             → no está guardado → coleccion.guardar(id, true)
3. ColeccionService.guardar()        → POST /api/pokemons {pokeapi_id, me_gusta: true}
4. logInterceptor                    → apunta la petición en la consola
5. FastAPI  crear()                  → ¿repetido? 409 · si no, pide datos a PokéAPI (o caché)
6. SQLModel                          → INSERT INTO pokemonguardado ... → devuelve el id
7. Respuesta 201 con el pokémon      → el servicio lo añade a lista (sin volver a pedir todo)
8. Signals                           → la carta muestra "✓ Guardado", el menú "Mi colección (1)"
```

**Probar la API sin frontend:** abre **http://localhost:8000/docs** (Swagger). Cada endpoint tiene un botón *Try it out*.

---

## 4. El frontend: qué se ha hecho para NO repetir código

| Antes (repetido) | Ahora (una sola vez) | Archivo |
|---|---|---|
| URL de la API escrita en cada servicio | `API_URL` | `core/api.config.ts` |
| `console.log` en cada servicio | **Interceptor** que registra TODAS las peticiones | `core/log.interceptor.ts` |
| Leer el mensaje de error en cada sitio | `mensajeError(err)` | `core/errores.ts` |
| `@if cargando / @else if error / @else` en cada pantalla | `<app-estado-carga>` con `<ng-content>` | `components/estado-carga/` |
| Botones 👍/👎 en cada pantalla | `<app-valoracion>` | `components/valoracion/` |
| subscribe + try/catch + "en curso" en cada operación | `ejecutar()` privado | `services/coleccion.service.ts` |
| Estilos de botón/rejilla/estado copiados en 6 `.css` | Clases globales `.btn`, `.grid-cartas`, `.estado`… + variables `--color-*` | `src/styles.css` |
| Transformar el JSON de PokéAPI en Angular | Lo transforma el backend; Angular usa los mismos nombres de campo | `models/pokemon.model.ts` |
| Una tarjeta para catálogo y otra para colección | La **misma** `<app-pokemon-card>` (acepta `PokemonBase`, y `PokemonGuardado` lo extiende) | `components/pokemon-card/` |

**Eficiencia:**
- La colección se pide **una vez**. Crear/editar/borrar actualizan la lista **en local** con la respuesta del servidor (no se vuelve a pedir todo).
- Filtrar (me gusta / no me gusta / sin valorar) es un `computed` en local: **0 peticiones**.
- "¿Está guardado?" usa un `Map` por `pokeapi_id` → búsqueda instantánea aunque tengas 1000.
- Backend: caché de pokémon + peticiones de detalle en paralelo (`asyncio.gather`).

---

## 5. El problema del CSS (cartas desiguales) y cómo se resolvió

**Diagnóstico** (medido, no a ojo): la altura dependía del nº de habilidades (1 → 435 px, 2 → 455 px, 3 → 475 px). La carta crecía con su contenido.

**Solución:**
1. `aspect-ratio: 63 / 88` → la carta tiene **siempre** la misma forma.
2. `container-type: inline-size` + `font-size: 4.2cqi` → todo se mide en `em` relativo al ancho de la carta: se ve igual en móvil y escritorio.
3. **Grid con filas fijas**; la imagen se queda el hueco sobrante (`minmax(0, 1fr)`).
4. Contenido variable **controlado**: 3 huecos de habilidad siempre, textos de una línea con "…".
5. Las rarezas solo cambian **colores y efectos**, nunca tamaños.

Comprobación en consola (todas deben dar 1.397):
```js
[...document.querySelectorAll('.carta')].map(c => (c.offsetHeight / c.offsetWidth).toFixed(3))
```

---

## 6. Arrancar todo

**Terminal 1 — API:**
```bash
cd "C:\Users\AlumnoM\OneDrive - Digitech\Escritorio\angular\pokedex-api"
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```
**Terminal 2 — Frontend:**
```bash
cd "C:\Users\AlumnoM\OneDrive - Digitech\Escritorio\angular\servicios-alumnos"
npx ng serve
```
Abre http://localhost:4200 · Documentación de la API: http://localhost:8000/docs

---

## 7. Depurar cada capa

| Capa | Herramienta | Qué mirar |
|---|---|---|
| Frontend | F12 → Consola | líneas `[HTTP] GET ... → 200 (35 ms)` del interceptor |
| Red | F12 → Network, filtro `8000` | la petición, su JSON enviado (Payload) y recibido (Response) |
| API | http://localhost:8000/docs | probar endpoints a mano |
| API | la terminal de uvicorn | cada petición y los errores de Python (traceback) |
| BD | extensión *SQLite Viewer* de VS Code → `pokedex.db` | tabla `pokemonguardado` |

---

## 8. Hacia Odoo y una tienda online

Es exactamente el mismo esquema, cambiando las piezas:

| Aquí | En una tienda con Odoo |
|---|---|
| PokéAPI (catálogo externo) | Odoo (productos, stock, precios) vía su API JSON-RPC/XML-RPC |
| `pokeapi.py` | `odoo_cliente.py` (mismo papel: único sitio que conoce Odoo) |
| `PokemonGuardado` + me gusta | carrito, favoritos, pedidos |
| SQLite | PostgreSQL (la misma BD que usa Odoo: solo cambia `DATABASE_URL`) |
| Pokédex / Mi colección | catálogo de productos / carrito |
| `<app-pokemon-card>` | tarjeta de producto |
