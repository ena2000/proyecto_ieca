import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { API } from '../constants/api.constants';
import { environment } from '../../../environments/environment';
import {
  etiquetaParaMes,
  getMesActualKey,
  getMesActualLabel,
  labelToPeriodoKey,
  periodoKeyFromFecha,
  estaPeriodoCerrado
} from '../../shared/utils/month.util';

const ULTIMO_CIERRE_KEY = 'ultimoCierre';
const PERIODOS_CERRADOS_KEY = 'periodosCerrados';

export interface ConfigCierre {
  ultimoCierre: string | null;
  periodosCerrados: string[];
  periodoActual: string;
  mesActualCerrado: boolean;
}

@Injectable({ providedIn: 'root' })
export class CierreService {

  private periodosCerrados: string[] = [];
  private ultimoCierre: string | null = null;
  private mesActualCerrado = false;

  constructor(private api: ApiService) {}

  async cargar(): Promise<void> {
    if (environment.useLocalFallback) {
      this.ultimoCierre = localStorage.getItem(ULTIMO_CIERRE_KEY);
      const raw = localStorage.getItem(PERIODOS_CERRADOS_KEY);
      try {
        this.periodosCerrados = raw ? JSON.parse(raw) : [];
      } catch {
        this.periodosCerrados = [];
      }
      if (!this.periodosCerrados.length && this.ultimoCierre) {
        const key = labelToPeriodoKey(this.ultimoCierre);
        if (key) this.periodosCerrados = [key];
      }
      this.mesActualCerrado = estaPeriodoCerrado(
        new Date().toISOString(),
        this.periodosCerrados
      );
      return;
    }

    try {
      const cfg = await firstValueFrom(
        this.api.get<ConfigCierre>(API.cierresEstado)
      );
      this.ultimoCierre = cfg.ultimoCierre;
      this.periodosCerrados = cfg.periodosCerrados ?? [];
      if (!this.periodosCerrados.length && cfg.ultimoCierre) {
        const key = labelToPeriodoKey(cfg.ultimoCierre);
        if (key) this.periodosCerrados = [key];
      }
      this.mesActualCerrado = cfg.mesActualCerrado ?? estaPeriodoCerrado(
        new Date().toISOString(),
        this.periodosCerrados
      );
    } catch (err) {
      console.error('[CierreService] cargar:', err);
    }
  }

  getPeriodoActualLabel(): string {
    return getMesActualLabel();
  }

  getUltimoCierreLabel(): string {
    return this.ultimoCierre ?? 'N/A';
  }

  isMesActualCerrado(): boolean {
    return this.mesActualCerrado;
  }

  estaCerrado(fecha?: string, cerradoFlag?: boolean): boolean {
    if (cerradoFlag === true) return true;
    return estaPeriodoCerrado(fecha, this.periodosCerrados);
  }

  etiquetaPeriodo(fecha?: string): string {
    const key = periodoKeyFromFecha(fecha);
    return key ? etiquetaParaMes(key) : getMesActualLabel();
  }

  aplicarCierreLocal(periodoLabel: string): void {
    const key = labelToPeriodoKey(periodoLabel) ?? getMesActualKey();
    if (!this.periodosCerrados.includes(key)) {
      this.periodosCerrados = [...this.periodosCerrados, key];
    }
    this.ultimoCierre = etiquetaParaMes(key);
    this.mesActualCerrado = estaPeriodoCerrado(
      new Date().toISOString(),
      this.periodosCerrados
    );
    localStorage.setItem(ULTIMO_CIERRE_KEY, this.ultimoCierre);
    localStorage.setItem(PERIODOS_CERRADOS_KEY, JSON.stringify(this.periodosCerrados));
  }

  sincronizarDesdeApi(cfg: Partial<ConfigCierre>): void {
    if (cfg.ultimoCierre !== undefined) this.ultimoCierre = cfg.ultimoCierre;
    if (cfg.periodosCerrados) this.periodosCerrados = cfg.periodosCerrados;
    if (cfg.mesActualCerrado !== undefined) {
      this.mesActualCerrado = cfg.mesActualCerrado;
    } else {
      this.mesActualCerrado = estaPeriodoCerrado(
        new Date().toISOString(),
        this.periodosCerrados
      );
    }
  }

  limpiarLocal(): void {
    this.periodosCerrados = [];
    this.ultimoCierre = null;
    this.mesActualCerrado = false;
    localStorage.removeItem(ULTIMO_CIERRE_KEY);
    localStorage.removeItem(PERIODOS_CERRADOS_KEY);
  }
}
