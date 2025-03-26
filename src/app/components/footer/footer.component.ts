import { Component, HostListener, OnInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Injectable } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
@Injectable({
  providedIn: 'root'
})

export class FooterComponent implements OnInit {

  constructor(private el: ElementRef) { }

  ngOnInit() {
    this.adjustPosition();
    window.onload = () => {
      this.adjustPosition();
    };
  }

  @HostListener('window:resize', ['$event'])
  @HostListener('window:scroll', ['$event'])
  adjustPosition(event?: Event) {

    const footer = this.el.nativeElement.querySelector('.site-footer') as HTMLElement;
    const content = document.querySelector('.container') as HTMLElement;

    if (!content) return;

    const windowHeight = window.innerHeight;
    const contentHeight = content.offsetHeight;
    const footerHeight = footer.offsetHeight;

    if (contentHeight + footerHeight < windowHeight) {
      footer.style.position = 'fixed';
      footer.style.bottom = '0';
    } else {
      footer.style.position = 'absolute';
      footer.style.bottom = 'auto';
    }
  }
}
