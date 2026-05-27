export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol?: string;
  estado?: string;
  ministerioId?: number;
  fechaFormateada?: string;
}
