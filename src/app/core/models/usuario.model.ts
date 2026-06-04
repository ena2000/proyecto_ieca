export interface Usuario {
  id: number;
  /** Username para iniciar sesión */
  usuario?: string;
  nombre: string;
  email: string;
  rol?: string;
  estado?: string;
  ministerioId?: number | null;
  fechaFormateada?: string;
}
