import {
  APORTACION_IGLESIA_PORCENTAJE,
  CUENTA_INGRESO_TALENTO_CODIGO,
  MINISTERIO_IGLESIA_NOMBRE,
  calcularMontoAportacionIglesia
} from '../constants/aportacion-iglesia.constants';
import {
  calcularMontoNetoMinisterio,
  crearIngresoIglesiaPorAportacion,
  asegurarAportacionIglesiaEnLista,
  aplicarAportacionOptimistaEnLista,
  idAportacionOptimista,
  filtrarIngresosTrasEliminarOrigen,
  ingresoEsTalento,
  ingresoRequiereAportacion
} from './aportacion-iglesia.util';
import { Ingreso } from '../../core/models';

describe('aportacion-iglesia.util', () => {
  it('constantes FE alineadas con la regla institucional (tambi?n fijada en BE)', () => {
    expect(APORTACION_IGLESIA_PORCENTAJE).toBe(0.33);
    expect(CUENTA_INGRESO_TALENTO_CODIGO).toBe('4105');
    expect(MINISTERIO_IGLESIA_NOMBRE).toBe('General');
    expect(calcularMontoAportacionIglesia(182)).toBe(60.06);
  });

  const ingresoTalento: Ingreso = {
    id: 10,
    fecha: '2026-06-01T12:00:00.000Z',
    descripcion: 'Evento talento',
    monto: 100,
    foto: '',
    categoria: 'Talento y eventos',
    cuentaCodigo: '4105',
    cuentaNombre: 'Talento y eventos',
    ministerio: 'Jóvenes',
    ministerioId: 1,
    estado: 'aprobado'
  };

  const ingresoDiezmo: Ingreso = {
    ...ingresoTalento,
    id: 11,
    categoria: 'Diezmos y ofrendas',
    cuentaCodigo: '4102',
    cuentaNombre: 'Diezmos y ofrendas',
    descripcion: 'Ofrenda'
  };

  it('calcula el 33% con dos decimales', () => {
    expect(calcularMontoAportacionIglesia(100)).toBe(33);
    expect(calcularMontoAportacionIglesia(150)).toBe(49.5);
  });

  it('detecta ingresos de talento solo por cuenta 4105', () => {
    expect(ingresoEsTalento(ingresoTalento)).toBeTrue();
    expect(ingresoEsTalento(ingresoDiezmo)).toBeFalse();
    expect(ingresoEsTalento({ ...ingresoDiezmo, cuentaCodigo: undefined, categoria: 'Talento escolar' })).toBeFalse();
  });

  it('solo requiere aportación en ingresos de talento de ministerio', () => {
    expect(ingresoRequiereAportacion(ingresoTalento)).toBeTrue();
    expect(ingresoRequiereAportacion(ingresoDiezmo)).toBeFalse();
    expect(ingresoRequiereAportacion({ ...ingresoTalento, ministerioId: undefined })).toBeFalse();
    expect(ingresoRequiereAportacion({ ...ingresoTalento, esAportacionIglesia: true })).toBeFalse();
    expect(ingresoRequiereAportacion({ ...ingresoTalento, aportacionGenerada: true })).toBeFalse();
  });

  it('calcula monto neto solo para talento', () => {
    expect(calcularMontoNetoMinisterio(ingresoTalento)).toBe(67);
    expect(calcularMontoNetoMinisterio(ingresoDiezmo)).toBe(100);
    expect(calcularMontoNetoMinisterio({ ...ingresoTalento, monto: 200, montoNetoMinisterio: 50 })).toBe(134);
  });

  it('crea ingreso de iglesia vinculado al ingreso origen', () => {
    const ingresoIglesia = crearIngresoIglesiaPorAportacion(ingresoTalento, 99, '01/06/2026');
    expect(ingresoIglesia.monto).toBe(33);
    expect(ingresoIglesia.esAportacionIglesia).toBeTrue();
    expect(ingresoIglesia.ingresoOrigenId).toBe(10);
    expect(ingresoIglesia.ministerio).toBe('General');
    expect(ingresoIglesia.descripcion).toContain('Evento talento');
    expect(ingresoIglesia.descripcion).toContain('Jóvenes');
    expect(ingresoIglesia.descripcion).not.toContain('ingreso #');
  });

  it('aplica aportación optimista al aprobar talento antes del API', () => {
    const pendiente: Ingreso = { ...ingresoTalento, estado: 'pendiente' };
    const lista = aplicarAportacionOptimistaEnLista([pendiente], {
      ...pendiente,
      estado: 'aprobado'
    });
    expect(lista).toHaveSize(2);
    expect(lista[0].esAportacionIglesia).toBeTrue();
    expect(lista[0].id).toBe(idAportacionOptimista(10));
    expect(lista[0].monto).toBe(33);
    expect(lista.find(i => Number(i.id) === 10)?.aportacionGenerada).toBeTrue();
  });

  it('inserta aportación en lista al aprobar ingreso talento (sin esperar sync)', () => {
    const origenAprobado: Ingreso = {
      ...ingresoTalento,
      aportacionGenerada: true,
      ingresoIglesiaId: 99,
      montoAportacionIglesia: 33,
      montoNetoMinisterio: 67
    };
    const lista = asegurarAportacionIglesiaEnLista([origenAprobado], origenAprobado);
    expect(lista).toHaveSize(2);
    expect(lista[0].id).toBe(99);
    expect(lista[0].esAportacionIglesia).toBeTrue();
    expect(lista[0].monto).toBe(33);
  });

  it('al eliminar ingreso talento quita también la aportación automática vinculada', () => {
    const aportacion: Ingreso = {
      id: 99,
      fecha: ingresoTalento.fecha,
      descripcion: 'Aportación',
      monto: 33,
      foto: '',
      categoria: 'Aportación de ministerio',
      ministerio: 'General',
      estado: 'aprobado',
      esAportacionIglesia: true,
      ingresoOrigenId: 10
    };
    const origenConVinculo: Ingreso = {
      ...ingresoTalento,
      aportacionGenerada: true,
      ingresoIglesiaId: 99,
      montoAportacionIglesia: 33,
      montoNetoMinisterio: 67
    };
    const lista = [origenConVinculo, aportacion, ingresoDiezmo];
    const filtrada = filtrarIngresosTrasEliminarOrigen(lista, 10);
    expect(filtrada.map(i => i.id)).toEqual([11]);
  });

  it('al eliminar ingreso talento quita aportación aunque falte ingresoIglesiaId en el origen', () => {
    const aportacion: Ingreso = {
      id: 50,
      fecha: ingresoTalento.fecha,
      descripcion: 'Aportación',
      monto: 33,
      foto: '',
      categoria: 'Aportación de ministerio',
      ministerio: 'General',
      estado: 'aprobado',
      esAportacionIglesia: true,
      ingresoOrigenId: 10
    };
    const lista = [ingresoTalento, aportacion];
    expect(filtrarIngresosTrasEliminarOrigen(lista, 10)).toEqual([]);
  });
});
