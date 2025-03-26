import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { FooterComponent } from '../../components/footer/footer.component';



@Component({
  selector: 'landing-component',
  standalone: true,
  imports: [SharedModule, FooterComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingComponent implements OnInit {
  usuario : string = 'pedro';

  constructor(
    private router: Router,
    private footer: FooterComponent,
    ) { }
  
  scrollToInicio() {
    const inicioElement = document.getElementById("inicio");
    if (inicioElement) {
      inicioElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  ngOnInit(): void {
    
    window.addEventListener('resize', () => {
      this.footer.adjustPosition();
    });

    window.addEventListener('scroll', () => {
      this.footer.adjustPosition();
    });

    window.addEventListener('load', () => {
      this.footer.adjustPosition();
    });

  }

  login() {
    this.router.navigate(['/auth/login']);
  }
}
