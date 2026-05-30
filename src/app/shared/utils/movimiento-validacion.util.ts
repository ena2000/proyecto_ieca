export interface ValidacionFormularioMovimiento {
  descripcion?: string;
  monto: number | null;
  fechaManualForm: string;
  cuentaCodigo?: string;
  ministerioId?: number;
  listaMinisteriosLength: number;
  ministerioScopeId: number | null;
}

export function esFormularioMovimientoValido(v: ValidacionFormularioMovimiento): boolean {
  const monto = Number(v.monto);
  const ministerioRequerido =
    v.listaMinisteriosLength > 0 && v.ministerioScopeId == null;
  const ministerioOk =
    v.ministerioScopeId != null ||
    v.listaMinisteriosLength === 0 ||
    v.ministerioId != null;

  return (
    (v.descripcion?.trim().length ?? 0) >= 3 &&
    !!v.cuentaCodigo?.trim() &&
    Number.isFinite(monto) &&
    monto > 0 &&
    v.fechaManualForm.length === 10 &&
    (!ministerioRequerido || v.ministerioId != null) &&
    ministerioOk
  );
}

export function mensajeValidacionMovimiento(v: ValidacionFormularioMovimiento): string {
  const monto = Number(v.monto);
  if (!Number.isFinite(monto) || monto <= 0) {
    return 'Ingresa un monto válido mayor a cero.';
  }
  if (v.listaMinisteriosLength > 0 && v.ministerioScopeId == null && v.ministerioId == null) {
    return 'Selecciona un ministerio.';
  }
  if (!v.cuentaCodigo?.trim()) {
    return 'Selecciona una cuenta contable.';
  }
  if ((v.descripcion?.trim().length ?? 0) < 3) {
    return 'La descripción debe tener al menos 3 caracteres.';
  }
  if (v.fechaManualForm.length !== 10) {
    return 'Ingresa una fecha válida (DD/MM/AAAA).';
  }
  return 'Por favor, completa los campos obligatorios correctamente.';
}
