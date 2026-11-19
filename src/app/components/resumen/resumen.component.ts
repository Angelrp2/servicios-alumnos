import { Component, inject } from '@angular/core';
import { AlumnosService } from '../../services/alumnos.service';

// =====================================================================
// SEGUNDO COMPONENTE que inyecta el MISMO servicio.
// No recibe nada por input() ni comparte nada con AlumnosPage:
// los dos piden el servicio a Angular y reciben LA MISMA instancia.
// Como el estado son signals, cuando AlumnosPage borra o añade
// un alumno, este resumen se actualiza solo. Esto es "estado compartido".
// =====================================================================
@Component({
  selector: 'app-resumen',
  template: `
    <div class="barra">
      📊 Resumen global: {{ alumnosService.total() }} alumnos ·
      {{ alumnosService.aprobados() }} aprobados ·
      media {{ alumnosService.notaMediaGeneral() }}
    </div>
  `,
  styles: `
    .barra {
      background: #24292f;
      color: #fff;
      padding: 10px 16px;
      font-family: system-ui, sans-serif;
    }
  `,
})
export class ResumenComponent {
  // protected: se puede usar en la plantilla, pero no desde fuera.
  protected alumnosService = inject(AlumnosService);
}
