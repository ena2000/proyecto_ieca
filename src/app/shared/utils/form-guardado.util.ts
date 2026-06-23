/** Duración estándar de toasts de validación / error al guardar formularios IECA. */
export const FORM_GUARDADO_TOAST_MS = 4500;

/** Texto del botón principal mientras se guarda (sin jerga técnica). */
export function etiquetaBotonGuardandoFormulario(modoEdicion: boolean): string {
  return modoEdicion ? 'Guardando…' : 'Registrando…';
}

/** Desplaza la vista al banner `.form-validation-error` del formulario activo. */
export function scrollAlErrorFormulario(): void {
  requestAnimationFrame(() => {
    document.querySelector('.form-validation-error')?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    });
  });
}

/**
 * Refresca la lista local del componente tras crear/actualizar/eliminar.
 * Mismo patrón en todos los CRUD para que la tabla se actualice al instante.
 */
export function refrescarListaTrasMutacion<T>(
  leerLista: () => T[],
  asignarLista: (lista: T[]) => void,
  actualizarVista?: () => void
): void {
  asignarLista([...leerLista()]);
  actualizarVista?.();
}
