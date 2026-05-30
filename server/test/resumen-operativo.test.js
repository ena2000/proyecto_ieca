const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  diasHastaFinDeMes,
  debeRecordarCierre,
  pendienteAntiguo,
  construirTextoResumen,
  construirAsuntoResumen
} = require('../src/utils/resumen-operativo');

describe('resumen-operativo (puro)', () => {
  it('diasHastaFinDeMes calcula días restantes del mes', () => {
    const fecha = new Date('2025-03-28T12:00:00.000Z');
    assert.equal(diasHastaFinDeMes(fecha), 3);
  });

  it('debeRecordarCierre activo en últimos 5 días', () => {
    const fecha = new Date('2025-05-28T12:00:00.000Z');
    assert.equal(debeRecordarCierre(5, fecha), true);
    const inicio = new Date('2025-05-10T12:00:00.000Z');
    assert.equal(debeRecordarCierre(5, inicio), false);
  });

  it('pendienteAntiguo usa auditCreadoEn', () => {
    const hace72h = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
    assert.equal(
      pendienteAntiguo({ estado: 'pendiente', auditCreadoEn: hace72h }, 48),
      true
    );
    assert.equal(
      pendienteAntiguo({ estado: 'aprobado', auditCreadoEn: hace72h }, 48),
      false
    );
  });

  it('construye asunto y cuerpo con pendientes', () => {
    const resumen = {
      generadoEn: '2025-05-30T12:00:00.000Z',
      horasPendiente: 48,
      pendientes: [{ tipo: 'gasto', id: 1, descripcion: 'Compra', monto: 100, ministerio: 'Juventud' }],
      cierre: { activo: true, etiquetaMes: 'Mayo 2025', diasRestantes: 1 },
      tieneContenido: true
    };
    assert.match(construirAsuntoResumen(resumen), /pendiente/i);
    const texto = construirTextoResumen(resumen);
    assert.match(texto, /Compra/);
    assert.match(texto, /cierre mensual/i);
  });
});
