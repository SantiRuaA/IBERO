import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';

@Component({
  selector: 'app-404',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './404.component.html',
  styleUrl: './404.component.scss'
})

export class NotFoundComponent implements OnInit{

  constructor(private location: Location) { }
  
  ngOnInit(): void {
    this.replaceStateWithNotFoundURL();
  }

  replaceStateWithNotFoundURL(): void {
    const currentUrl = this.location.path();
    const notFoundUrl = `/not-found${currentUrl}`;
    window.history.replaceState({}, '', notFoundUrl);
  }

}
