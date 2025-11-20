import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { AppShellComponent } from './app-shell.component';
import { PublicMonitorComponent } from './public-monitor.component';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimations(),
    provideRouter([
      { path: '', component: AppShellComponent },
      { path: 'monitor', component: PublicMonitorComponent },
    ]),
  ]
};
