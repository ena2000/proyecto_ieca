const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  chunkArray,
  collectMovimientosDelPeriodo,
  FIRESTORE_BATCH_LIMIT
} = require('../src/utils/cierre-mensual');

describe('cierre-mensual (utilidades)', () => {
  it('chunkArray divide en bloques del tamaño indicado', () => {
    const items = Array.from({ length: 5 }, (_, i) => i);
    assert.deepEqual(chunkArray(items, 2), [[0, 1], [2, 3], [4]]);
  });

  it('FIRESTORE_BATCH_LIMIT es 500', () => {
    assert.equal(FIRESTORE_BATCH_LIMIT, 500);
  });

  it('collectMovimientosDelPeriodo filtra por mes', () => {
    const updates = collectMovimientosDelPeriodo(
      [
        { id: 1, fecha: '2026-05-10T12:00:00.000Z' },
        { id: 2, fecha: '2026-06-15T12:00:00.000Z' }
      ],
      '2026-05',
      'ingresos'
    );
    assert.equal(updates.length, 1);
    assert.equal(updates[0].id, '1');
    assert.equal(updates[0].data.cerrado, true);
    assert.equal(updates[0].data.periodoCierre, '2026-05');
  });
});
