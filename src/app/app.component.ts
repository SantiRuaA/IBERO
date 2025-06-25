import { Component, OnInit } from '@angular/core';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LandingComponent } from './views/landing-page/landing-page.component';
import { SharedModule } from './shared/shared.module';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { trigger, state, style, transition, animate } from '@angular/animations';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SharedModule, LandingComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  
  animations: [
    trigger('transitionMessages', [
      state('*', style({ opacity: 1 })),
      transition(':enter', animate('500ms ease-in-out')),
      transition(':leave', animate('500ms ease-in-out', style({ opacity: 0 })))
    ])
  ]
})
export class AppComponent {
  title = 'IBERO';

}

