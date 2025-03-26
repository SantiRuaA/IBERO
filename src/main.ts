import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { CommonModule } from '@angular/common';
import { AppComponent } from './app/app.component';
import { provideAnimations } from '@angular/platform-browser/animations';


bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));