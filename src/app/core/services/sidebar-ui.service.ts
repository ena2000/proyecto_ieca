import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const MOBILE_MAX_WIDTH_PX = 768;

@Injectable({ providedIn: 'root' })
export class SidebarUiService {
  private readonly mobileOpenSubject = new BehaviorSubject(false);
  readonly mobileOpen$ = this.mobileOpenSubject.asObservable();

  isMobileViewport(): boolean {
    return typeof window !== 'undefined'
      && window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH_PX}px)`).matches;
  }

  toggleMobile(): void {
    if (!this.isMobileViewport()) return;
    this.mobileOpenSubject.next(!this.mobileOpenSubject.value);
  }

  closeMobile(): void {
    this.mobileOpenSubject.next(false);
  }

  get mobileOpen(): boolean {
    return this.mobileOpenSubject.value;
  }
}
