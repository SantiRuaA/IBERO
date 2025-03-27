import { Component, ElementRef, HostListener, OnDestroy, OnInit, Renderer2, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { RaService } from '../../../services/api/ra.service';
import { HasUnsavedChanges } from '../../../auth/guards/unsaved-changes.guard';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { NavigationComponent } from '../../../components/navigation/navigation.component';
import { FooterComponent } from '../../../components/footer/footer.component';

@Component({
  selector: 'app-new-resultado',
  standalone: true,
  imports: [CommonModule, SharedModule, NavigationComponent, FooterComponent],
  templateUrl: './new-resultado.component.html',
  styleUrl: './new-resultado.component.scss'
})
export class NewResultadoComponent implements OnDestroy, HasUnsavedChanges {

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(e: BeforeUnloadEvent) {
    if (this.hasUnsavedChanges()) {
      e.returnValue = '';
    }
  }

  constructor(
    private router: Router,
    private api: RaService,
  ) { }

  hasUnsavedChanges(): boolean {
    this.loading = false; 
    return this.newForm.dirty
  }

  ngOnInit(): void {
  }

  private subscriptions: Subscription = new Subscription();
  competencia : any[] = [];
  loading: boolean = false;

  newForm = new FormGroup({
    nomResultadoAprendizaje:  new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z0-9 ñÑáéíóúÁÉÍÓÚ,.]{1,250}$')]),
  });

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  postForm(form: any) {
    Swal.fire({
      icon: 'question',
      title: '¿Estás seguro de que deseas crear este saber?',
      showCancelButton: true,
      showCloseButton: true,
      allowOutsideClick: false,
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Confirmar',
      confirmButtonColor: '#39a900',
      reverseButtons: true,
      customClass: {
        confirmButton: 'my-swal-confirm', // Aplica la clase personalizada al botón de confirmación
      },
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        const postRatSub = this.api.postResultadoAprendizaje(form).subscribe(data => {
          if (data.status == 'ok') {
            this.newForm.reset();
            this.router.navigate(['/resultados-aprendizaje']);
            Swal.fire({
              icon: 'success',
              title: 'Saber creado',
              text: 'El saber ha sido creado exitosamente.',
              toast: true,
              showConfirmButton: false,
              timer: 5000,
              position: 'top-end',
              timerProgressBar: true,
              showCloseButton: true,
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error al crear',
              text: data.msj,
              confirmButtonColor: '#39a900'
            });
          }
          this.loading = false;
        },
          (error) => {
            this.loading = false;
            Swal.fire({
              icon: 'error',
              title: 'Error en el servidor',
              text: 'Ha ocurrido un error al comunicarse con el servidor. Por favor, revisa tu conexión a internet o inténtalo nuevamente',
              confirmButtonColor: '#39a900'
            });
          });

        this.subscriptions.add(postRatSub);
      }
    });
  }

  goBack() {
    this.loading = true;
    this.router.navigate(['resultados-aprendizaje']);
  }

}
