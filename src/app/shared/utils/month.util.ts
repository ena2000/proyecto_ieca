const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MESES_CORTOS_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

/** Etiqueta corta de mes (0 = enero, 11 = diciembre). */
export function mesCortoEs(indiceMes: number): string {
  return MESES_CORTOS_ES[indiceMes] ?? '';
}

export function padMes(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function etiquetaParaMes(valor: string): string {
  const [anio, mes] = valor.split('-');
  const indice = parseInt(mes, 10) - 1;
  if (indice < 0 || indice > 11) return valor;
  return `${MESES_ES[indice]} ${anio}`;
}

export function getMesActualLabel(): string {
  const ahora = new Date();
  return `${MESES_ES[ahora.getMonth()]} ${ahora.getFullYear()}`;
}

export function getMesActualKey(): string {
  return padMes(new Date());
}

export function labelToPeriodoKey(label: string): string | null {
  const parts = label.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const anio = parts[parts.length - 1];
  const mesNombre = parts.slice(0, -1).join(' ');
  const idx = MESES_ES.findIndex(
    m => m.toLowerCase() === mesNombre.toLowerCase()
  );
  if (idx < 0 || !/^\d{4}$/.test(anio)) return null;
  return `${anio}-${String(idx + 1).padStart(2, '0')}`;
}

export function periodoKeyFromFecha(fecha: string | undefined): string | null {
  if (!fecha) return null;
  const s = String(fecha).trim();
  // YYYY-MM-DD (o ISO que empieza así): usar calendario local, no UTC
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) {
    return `${m[1]}-${m[2]}`;
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return padMes(d);
}

export function estaPeriodoCerrado(
  fecha: string | undefined,
  periodosCerrados: string[]
): boolean {
  const key = periodoKeyFromFecha(fecha);
  return !!(key && periodosCerrados.includes(key));
}
