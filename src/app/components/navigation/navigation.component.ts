import { Component, OnInit, Inject, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { SharedModule } from '../../shared/shared.module';
import { MatMenuTrigger } from '@angular/material/menu';
import { map, shareReplay } from 'rxjs/operators';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Observable } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { MatTooltipModule } from '@angular/material/tooltip';


@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, SharedModule, MatToolbarModule, MatTooltipModule],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss'
})
export class NavigationComponent implements OnInit {
  @ViewChild('userMenuTrigger') userMenuTrigger!: MatMenuTrigger;
  private breakpointObserver = inject(BreakpointObserver);


  constructor(
    private router: Router,
  ) { }

  ngOnInit(): void {

  }

  goToModule(ruta: string) {
    this.router.navigate([ruta]);
    if (ruta == '/auth/login') {
      this.logOut();
    }
  }

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );


  logOut(): void {
    Swal.fire({
      icon: 'question',
      title: 'Cerrar sesión',
      text: '¿Estás seguro de que deseas cerrar sesión?',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#39a900',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['auth/login']);
        localStorage.removeItem('token');
        localStorage.removeItem('uid');
      }
    });
  }

  cambiarPWD(): void {
    this.router.navigate(['cambiarPWD']);
  }

  toggleUserPanel(): void {
    if (this.userMenuTrigger) {
      this.userMenuTrigger.openMenu();
    }
  }

  Instructor() {
    this.router.navigate(['/instructor']);
  };

  Rda() {
    this.router.navigate(['resultados-aprendizaje']);
  };

  Competencia() {
    this.router.navigate(['competencia']);
  };

  Programa() {
    this.router.navigate(['programa']);
  };

  Programacion() {
    this.router.navigate(['programacion']);
  };

  Info() {
    this.router.navigate(['info']);
  };

}
