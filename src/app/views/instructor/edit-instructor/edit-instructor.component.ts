import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, Renderer2, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { InstructorService } from '../../../services/api/instructor.service';
import { Subscription, forkJoin } from 'rxjs';
import { HasUnsavedChanges } from '../../../auth/guards/unsaved-changes.guard';
import Swal from 'sweetalert2';
import { NavigationComponent } from '../../../components/navigation/navigation.component';
import { FooterComponent } from '../../../components/footer/footer.component';

@Component({
  selector: 'app-edit-instructor',
  standalone: true,
  imports: [CommonModule, SharedModule, NavigationComponent, FooterComponent],
  templateUrl: './edit-instructor.component.html',
  styleUrl: './edit-instructor.component.scss'
})
export class EditInstructorComponent implements OnInit, OnDestroy, HasUnsavedChanges{

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(e: BeforeUnloadEvent) {
    if (this.hasUnsavedChanges()) {
      e.returnValue = '';
    }
  }
  
  private subscriptions: Subscription = new Subscription();

  constructor(
    private router: Router,
    private api: InstructorService,
    private activatedRouter: ActivatedRoute,
  ) { }

  hasUnsavedChanges(): boolean {
    this.loading = false;
    return this.editForm.dirty
  }

  dataInstructor: any = [];
  tiposDocumento: any[] = [];
  tiposInstructor: any[] = [];
  loading: boolean = true;

  editForm = new FormGroup({
    idInstructor: new FormControl(''),
    documentoInstructor: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{7,10}$')]),
    idTipoDocumento: new FormControl('', [Validators.required]),
    nombreInstructor: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z ñÑáéíóúÁÉÍÓÚ,.]{1,30}$')]),
    apellidoInstructor: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z ñÑáéíóúÁÉÍÓÚ,.]{1,30}$')]),
    telefonoInstructor: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{10,15}$')]),
    correoInstructor: new FormControl('', [Validators.required, Validators.pattern('^[\\w.%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'), Validators.maxLength(55)]),
    idTipoInstructor: new FormControl('', [Validators.required]),
  });

  ngOnInit(): void {
    let idInstructor = this.activatedRouter.snapshot.paramMap.get('id');
    this.loading = true;

    const forkJoinSub = forkJoin([this.api.getOneInstructor(idInstructor ?? ''), this.api.getTipoDocumento(), this.api.getTipoInstructor()]).subscribe(
      ([dataInstructor, tiposDocumento, tiposInstructor]) => {
        this.dataInstructor = dataInstructor ? [dataInstructor] : [];
        this.tiposDocumento = tiposDocumento ? tiposDocumento : [];
        this.tiposInstructor = tiposInstructor ? tiposInstructor : [];
        const idTipoDocumento = this.dataInstructor[0]?.idTipoDocumento;
        const idTipoInstructor = this.dataInstructor[0]?.idTipoInstructor;
        
        this.editForm.setValue({
          'idInstructor': this.dataInstructor[0]?.idInstructor || '',
          'documentoInstructor': this.dataInstructor[0]?.documentoInstructor || '',
          'idTipoDocumento': this.dataInstructor[0]?.idTipoDocumento || '',
          'nombreInstructor': this.dataInstructor[0]?.nombreInstructor || '',
          'apellidoInstructor': this.dataInstructor[0]?.apellidoInstructor || '',
          'telefonoInstructor': this.dataInstructor[0]?.telefonoInstructor || '',
          'correoInstructor': this.dataInstructor[0]?.correoInstructor || '',
          'idTipoInstructor': this.dataInstructor[0]?.idTipoInstructor || '',
        });
        this.tiposDocumento = tiposDocumento;
        this.tiposInstructor = tiposInstructor;
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
      }
    );
    this.subscriptions.add(forkJoinSub);
  }

  

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  postForm(id: any) {
    Swal.fire({
      icon: 'question',
      title: '¿Estás seguro de que deseas modificar este instructor?',
      showCancelButton: true,
      showCloseButton: true,
      allowOutsideClick: false,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#39a900',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        const putCltSub = this.api.putInstructor(id).subscribe(
          (data) => {
            if (data.status == 'ok') {
              this.editForm.reset();
              this.router.navigate(['/instructor']);
              Swal.fire({
                icon: 'success',
                title: 'Instructor modificado',
                text: 'El instructor ha sido modificado exitosamente.',
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
                title: 'Error al modificar',
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
        this.subscriptions.add(putCltSub);
      }
    });
  }


  goBack() {
    this.loading = true;
    this.router.navigate(['/instructor']);
  }
}
