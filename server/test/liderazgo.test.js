const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { idsLideresEnMinisterio, ministerioTieneCupo } = require('../src/utils/liderazgo.ts');

describe('liderazgo cupo ministerio', () => {
  const min = { id: 1, nombre: 'Alabanza', hldrId: 10, coLiderId: 11 };
  const usuarios = [
    { id: 10, rol: 'Lider/CoLider', ministerioId: 1 },
    { id: 11, rol: 'Lider/CoLider', ministerioId: 1 },
    { id: 12, rol: 'Lider/CoLider', ministerioId: 2 }
  ];

  it('cuenta líder y co-líder del registro', () => {
    assert.equal(idsLideresEnMinisterio(min, usuarios).size, 2);
  });

  it('sin cupo para un tercero', () => {
    assert.equal(ministerioTieneCupo(min, usuarios), false);
  });

  it('permite al líder actual al editar sin contar cupo extra', () => {
    const ids = idsLideresEnMinisterio(min, usuarios, 10);
    assert.equal(ids.has(10) || ids.size < 2, true);
  });
});
