/** Paleta y estilos de celdas para exportación Excel (marca IECA). */
export const IECA_EXCEL = {
  blue: '2E358F',
  blueSoft: 'E8EAF6',
  yellow: 'F4E530',
  green: '10B981',
  greenSoft: 'D1FAE5',
  red: 'E42021',
  redSoft: 'FEE2E2',
  white: 'FFFFFF',
  grayBg: 'F4F7FB',
  altRow: 'F8FAFC',
  text: '1E293B',
  textMuted: '64748B',
  border: 'E2E8F0'
} as const;

export type ExcelCellStyle = {
  font?: {
    name?: string;
    sz?: number;
    bold?: boolean;
    color?: { rgb: string };
  };
  fill?: { fgColor: { rgb: string } };
  alignment?: {
    horizontal?: 'left' | 'center' | 'right';
    vertical?: 'center' | 'top';
    wrapText?: boolean;
  };
  border?: Record<string, { style?: string; color?: { rgb: string } }>;
  numFmt?: string;
};

const FONT = 'Segoe UI';

export function estiloTituloPrincipal(): ExcelCellStyle {
  return {
    font: { name: FONT, sz: 16, bold: true, color: { rgb: IECA_EXCEL.white } },
    fill: { fgColor: { rgb: IECA_EXCEL.blue } },
    alignment: { horizontal: 'left', vertical: 'center' }
  };
}

export function estiloSubtitulo(): ExcelCellStyle {
  return {
    font: { name: FONT, sz: 11, bold: true, color: { rgb: IECA_EXCEL.blue } },
    fill: { fgColor: { rgb: IECA_EXCEL.yellow } },
    alignment: { horizontal: 'left', vertical: 'center' }
  };
}

export function estiloMeta(): ExcelCellStyle {
  return {
    font: { name: FONT, sz: 10, color: { rgb: IECA_EXCEL.textMuted } },
    fill: { fgColor: { rgb: IECA_EXCEL.grayBg } },
    alignment: { horizontal: 'left', vertical: 'center' }
  };
}

export function estiloEncabezadoTabla(): ExcelCellStyle {
  return {
    font: { name: FONT, sz: 10, bold: true, color: { rgb: IECA_EXCEL.white } },
    fill: { fgColor: { rgb: IECA_EXCEL.blue } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: bordeCelda()
  };
}

export function estiloFilaDatos(par: boolean): ExcelCellStyle {
  return {
    font: { name: FONT, sz: 10, color: { rgb: IECA_EXCEL.text } },
    fill: { fgColor: { rgb: par ? IECA_EXCEL.altRow : IECA_EXCEL.white } },
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
    border: bordeCelda()
  };
}

export function estiloMoneda(color?: 'green' | 'red' | 'default', par = false): ExcelCellStyle {
  const rgb =
    color === 'green' ? IECA_EXCEL.green :
    color === 'red' ? IECA_EXCEL.red :
    IECA_EXCEL.text;
  return {
    font: { name: FONT, sz: 10, bold: color !== 'default', color: { rgb } },
    fill: { fgColor: { rgb: par ? IECA_EXCEL.altRow : IECA_EXCEL.white } },
    alignment: { horizontal: 'right', vertical: 'center' },
    numFmt: '#,##0.00',
    border: bordeCelda()
  };
}

export function estiloTotalLabel(): ExcelCellStyle {
  return {
    font: { name: FONT, sz: 10, bold: true, color: { rgb: IECA_EXCEL.text } },
    fill: { fgColor: { rgb: IECA_EXCEL.blueSoft } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: bordeCelda()
  };
}

export function estiloTotalValor(tipo: 'ingreso' | 'gasto' | 'saldo'): ExcelCellStyle {
  const rgb =
    tipo === 'ingreso' ? IECA_EXCEL.green :
    tipo === 'gasto' ? IECA_EXCEL.red :
    IECA_EXCEL.blue;
  const bg =
    tipo === 'ingreso' ? IECA_EXCEL.greenSoft :
    tipo === 'gasto' ? IECA_EXCEL.redSoft :
    IECA_EXCEL.blueSoft;
  return {
    font: { name: FONT, sz: 11, bold: true, color: { rgb } },
    fill: { fgColor: { rgb: bg } },
    alignment: { horizontal: 'right', vertical: 'center' },
    numFmt: '#,##0.00',
    border: bordeCelda()
  };
}

export function estiloSeccion(): ExcelCellStyle {
  return {
    font: { name: FONT, sz: 11, bold: true, color: { rgb: IECA_EXCEL.blue } },
    fill: { fgColor: { rgb: IECA_EXCEL.blueSoft } },
    alignment: { horizontal: 'left', vertical: 'center' }
  };
}

function bordeCelda(): ExcelCellStyle['border'] {
  const b = { style: 'thin', color: { rgb: IECA_EXCEL.border } };
  return { top: b, bottom: b, left: b, right: b };
}
