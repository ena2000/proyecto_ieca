/** Resuelve el estado al crear o editar según rol y registro actual. */
export function resolverEstadoAlGuardar<T extends { id: number }, E extends string>(opts: {
  esLider: boolean;
  modoEdicion: boolean;
  idEditando: number | null;
  lista: T[];
  estadoAprobado: E;
  estadoPendiente: E;
  leerEstado: (item: T) => E;
}): E {
  if (opts.esLider) return opts.estadoPendiente;
  if (!opts.modoEdicion || opts.idEditando === null) return opts.estadoAprobado;

  const actual = opts.lista.find(i => i.id === opts.idEditando);
  if (!actual) return opts.estadoAprobado;

  const actualEstado = opts.leerEstado(actual);
  if (actualEstado !== opts.estadoAprobado) return opts.estadoPendiente;
  return actualEstado;
}
