const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

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
  const d = new Date(fecha);
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
