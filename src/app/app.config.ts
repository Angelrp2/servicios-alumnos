import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { logInterceptor } from './core/log.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    // Registra HttpClient en el inyector raíz (sin esto: NullInjectorError).
    //   withFetch()        → por dentro usa la API fetch del navegador
    //   withInterceptors() → filtros por los que pasan TODAS las peticiones
    provideHttpClient(withFetch(), withInterceptors([logInterceptor])),
  ],
};
