import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { firebaseConfig } from './firebase-config';

import { routes } from './app.routes';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: 'FirebaseApp', useValue: app },
    { provide: 'FirebaseDatabase', useValue: database }
  ]
};
