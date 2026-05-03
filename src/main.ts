import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { ApplicationConfig } from '@angular/core'; // <--- Necesario para definir appConfig

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

/**
 * Definimos la configuración de la aplicación.
 * Aquí es donde vive el Router que hace que el menú funcione.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
};

/**
 * Arrancamos la aplicación pasando el AppComponent 
 * y el objeto appConfig que definimos arriba.
 */
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));