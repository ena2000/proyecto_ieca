import { EnvironmentProviders, Provider } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideIonicAngular } from '@ionic/angular/standalone';

/** Providers comunes para specs de componentes standalone Ionic. */
export function provideComponentTestBed(): (Provider | EnvironmentProviders)[] {
  return [
    provideIonicAngular(),
    provideRouter([]),
    provideHttpClient(),
    provideHttpClientTesting()
  ];
}
