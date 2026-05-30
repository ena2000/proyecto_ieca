import { TableActions } from 'src/app/components/tabla-general/tabla-general.component';

export function accionesTablaMovimiento(opts: {
  puedeAprobar: boolean;
  soloLectura: boolean;
  esAdministrador: boolean;
  esLider: boolean;
}): TableActions {
  if (opts.puedeAprobar && opts.soloLectura) {
    return { edit: false, delete: false, approve: true, reject: true };
  }
  if (opts.esAdministrador) {
    return { edit: true, delete: true, approve: true, reject: true };
  }
  if (opts.esLider) {
    return { edit: true, delete: true };
  }
  return { edit: !opts.soloLectura, delete: !opts.soloLectura };
}
