import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { tap } from 'rxjs';

// =====================================================================
// INTERCEPTOR: un "filtro" por el que pasan TODAS las peticiones HTTP.
// Antes cada servicio tenía sus propios console.log → código repetido.
// Ahora se registra una vez (app.config.ts) y vale para toda la app.
//
// Muestra en consola:  [HTTP] GET http://localhost:8000/api/pokemons → 200 (35 ms)
// =====================================================================
export const logInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const inicio = performance.now();
  const ms = () => Math.round(performance.now() - inicio);

  return siguiente(peticion).pipe(
    tap({
      next: evento => {
        if (evento instanceof HttpResponse) {
          console.log(`[HTTP] ${peticion.method} ${peticion.urlWithParams} → ${evento.status} (${ms()} ms)`);
        }
      },
      error: err => console.warn(`[HTTP] ${peticion.method} ${peticion.urlWithParams} → ${err.status} (${ms()} ms)`),
    })
  );
};
