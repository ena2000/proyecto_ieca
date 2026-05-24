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
