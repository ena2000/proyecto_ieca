import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, NoPreloading } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { ApplicationConfig } from '@angular/core';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { refreshInterceptor } from './app/core/interceptors/refresh.interceptor';
import { networkRetryInterceptor } from './app/core/interceptors/network-retry.interceptor';
import { errorInterceptor } from './app/core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(NoPreloading)),
    // Orden (petición): auth → error → refresh → networkRetry → backend.
    // En la respuesta, networkRetry/refresh ven el 401 ANTES que error lo convierta.
    provideHttpClient(withInterceptors([
      authInterceptor,
      errorInterceptor,
      refreshInterceptor,
      networkRetryInterceptor
    ])),
  ],
};

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));