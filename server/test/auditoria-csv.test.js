const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  formatFechaFormateadaMovimiento,
  formatActorAuditoria,
  buildMapaNombresUsuarios
} = require('../dist/utils/auditoria-csv');

describe('auditoria-csv', () => {
  it('combina fecha del movimiento con hora de auditCreadoEn', () => {
    const out = formatFechaFormateadaMovimiento({
      fechaFormateada: '23/06/2026',
      fecha: '2026-06-23T06:00:00.000Z',
      auditCreadoEn: '2026-06-23T15:45:12.000Z'
    });
    assert.match(out, /^23\/06\/2026 \d{2}:\d{2}$/);
    assert.notEqual(out, '23/06/2026');
  });

  it('resuelve aprobadoPor con nombre e id', () => {
    const mapa = buildMapaNombresUsuarios([{ id: 1, nombre: 'Milena Mariscal' }]);
    assert.equal(formatActorAuditoria('1', mapa), 'Milena Mariscal (#1)');
  });
});
