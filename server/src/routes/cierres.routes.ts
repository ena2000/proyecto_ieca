const express = require('express');
const {
  getMesActualLabel,
  getMesActualKey,
  getPeriodosCerrados,
  getUltimoCierreLabel
} = require('../utils/cierre');

const router = express.Router();

/** GET /api/cierres/estado — periodos cerrados (lectura para todos los roles autenticados). */
router.get('/estado', async (_req, res) => {
  try {
    const [ultimoCierre, periodosCerrados] = await Promise.all([
      getUltimoCierreLabel(),
      getPeriodosCerrados()
    ]);
    const mesActualKey = getMesActualKey();
    res.json({
      ultimoCierre: ultimoCierre ?? null,
      periodosCerrados,
      periodoActual: getMesActualLabel(),
      mesActualCerrado: periodosCerrados.includes(mesActualKey)
    });
  } catch (err) {
    console.error('[cierres GET estado]', err);
    res.status(500).json({ message: 'Error al leer periodos de cierre' });
  }
});

module.exports = router;
