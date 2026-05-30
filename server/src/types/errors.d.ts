/** Permite `err.status` en errores HTTP lanzados desde utilidades legacy. */
interface Error {
  status?: number;
}
