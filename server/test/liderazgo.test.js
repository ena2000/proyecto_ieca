const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  colaboradoresEnMinisterio,
  esColaboradorMinisterio
} = require('../src/utils/liderazgo.ts');
const { normalizarRol } = require('../src/middleware/auth');

describe('colaboradores de ministerio', () => {
  const usuarios = [
    { id: 10, rol: 'Colaborador', ministerioId: 1, estado: 'Activo' },
    { id: 11, rol: 'Colaborador', ministerioId: 1, estado: 'Activo' },
    { id: 12, rol: 'Lider/CoLider', ministerioId: 2, estado: 'Activo' }
  ];

  it('lista colaboradores activos de un ministerio', () => {
    const lista = colaboradoresEnMinisterio(1, usuarios);
    assert.equal(lista.length, 2);
  });

  it('normaliza rol legacy a Colaborador', () => {
    assert.equal(normalizarRol('Lider/CoLider'), 'Colaborador');
    assert.equal(esColaboradorMinisterio('Lider/CoLider'), true);
  });
});
