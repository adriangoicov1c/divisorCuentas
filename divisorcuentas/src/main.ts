import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';


import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { Storage } from '@ionic/storage-angular';
import { Camera } from '@awesome-cordova-plugins/camera/ngx';


bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    {
      provide: Storage,
      useFactory: () => new Storage(),
    },
    Camera
  ],
});
