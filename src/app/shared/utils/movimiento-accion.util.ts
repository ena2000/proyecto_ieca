export type AccionFilaEnCurso = { id: number; tipo: 'aprobar' | 'rechazar' };

export function etiquetaAccionFilaEnCurso(tipo: AccionFilaEnCurso['tipo']): string {
  return tipo === 'aprobar' ? 'Aprobando registro…' : 'Rechazando registro…';
}

export function aplicarEstadoOptimistaEnLista<
  T extends { id?: number | null; estado?: string; estadoEtiqueta?: string }
>(lista: T[], id: number, estado: string, estadoEtiqueta: string): T[] {
  const numId = Number(id);
  return lista.map(item =>
    Number(item.id) === numId ? { ...item, estado, estadoEtiqueta } : item
  );
}
