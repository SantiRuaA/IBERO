import { Component, ElementRef, HostListener, OnDestroy, OnInit, Renderer2, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { InstructorService } from '../../../services/api/instructor.service';
import { HasUnsavedChanges } from '../../../auth/guards/unsaved-changes.guard';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { NavigationComponent } from '../../../components/navigation/navigation.component';
import { FooterComponent } from '../../../components/footer/footer.component';

@Component({
  selector: 'app-new-instructor',
  standalone: true,
  imports: [CommonModule, SharedModule, NavigationComponent, FooterComponent],
  templateUrl: './new-instructor.component.html',
  styleUrl: './new-instructor.component.scss'
})
export class NewInstructorComponent implements OnInit, OnDestroy, HasUnsavedChanges {

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(e: BeforeUnloadEvent) {
    if (this.hasUnsavedChanges()) {
      e.returnValue = '';
    }
  }

  constructor(
    private router: Router,
    private api: InstructorService,
  ) { }

  hasUnsavedChanges(): boolean {
    this.loading = false;
    return this.newForm.dirty
  }

  private subscriptions: Subscription = new Subscription();
  tiposDocumento: any[] = [];
  tiposInstructor: any[] = [];
  loading: boolean = true;

  newForm = new FormGroup({
    documentoInstructor: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{7,10}$')]),
    idTipoDocumento: new FormControl('', [Validators.required]),
    nombreInstructor: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z ñÑáéíóúÁÉÍÓÚ,.]{1,30}$')]),
    apellidoInstructor: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z ñÑáéíóúÁÉÍÓÚ,.]{1,30}$')]),
    telefonoInstructor: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{10,15}$')]),
    correoInstructor: new FormControl('', [Validators.required, Validators.pattern('^[\\w.%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'), Validators.maxLength(55)]),
    idTipoInstructor: new FormControl('', [Validators.required]),
  });

  ngOnInit(): void {
    const getTipoDocSub = this.api.getTipoDocumento().subscribe(data => {
      this.tiposDocumento = data;
      this.loading = false;
    });
    const getTipoInstSub = this.api.getTipoInstructor().subscribe(data => {
      this.tiposInstructor = data;
      this.loading = false;
    });
    this.subscriptions.add(getTipoDocSub);
    this.subscriptions.add(getTipoInstSub);

  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  postForm(form: any) {
    Swal.fire({
      icon: 'question',
      title: '¿Estás seguro de que deseas crear este instructor?',
      showCancelButton: true,
      showCloseButton: true,
      allowOutsideClick: false,
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Confirmar',
      confirmButtonColor: '#39a900',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        const postCltSub = this.api.postInstructor(form).subscribe(data => {
          if (data.status == 'ok') {
            this.newForm.reset();
            this.router.navigate(['/instructor']);
            Swal.fire({
              icon: 'success',
              title: 'Instructor creado',
              text: 'El instructor ha sido creado exitosamente.',
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

        this.subscriptions.add(postCltSub);
      }
    });
  }

  goBack() {
    this.loading = true;
    this.router.navigate(['/instructor']);
  }
}

