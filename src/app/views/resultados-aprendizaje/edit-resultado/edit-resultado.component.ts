import { Component, ElementRef, HostListener, OnDestroy, OnInit, Renderer2, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { RaService } from '../../../services/api/ra.service';
import { HasUnsavedChanges } from '../../../auth/guards/unsaved-changes.guard';
import { Subscription, forkJoin } from 'rxjs';
import Swal from 'sweetalert2';
import { NavigationComponent } from '../../../components/navigation/navigation.component';
import { FooterComponent } from '../../../components/footer/footer.component';

@Component({
  selector: 'app-edit-resultado',
  standalone: true,
  imports: [CommonModule, SharedModule, NavigationComponent, FooterComponent],
  templateUrl: './edit-resultado.component.html',
  styleUrl: './edit-resultado.component.scss'
})
export class EditResultadoComponent implements OnInit, OnDestroy, HasUnsavedChanges{

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(e: BeforeUnloadEvent) {
    if (this.hasUnsavedChanges()) {
      e.returnValue = '';
    }
  }

  private subscriptions: Subscription = new Subscription();

  constructor(
    private router: Router,
    private api: RaService,
    private activatedRouter: ActivatedRoute,
  ) { }

  hasUnsavedChanges(): boolean {
    return this.editForm.dirty
  }

  dataRa: any = [];
  loading: boolean = true;

  editForm = new FormGroup({
    idResultadoAprendizaje: new FormControl(''),
    nomResultadoAprendizaje: new FormControl('', [Validators.required]),
  });

  ngOnInit(): void {
    let idRa = this.activatedRouter.snapshot.paramMap.get('id');
    this.loading = true;

    const forkJoinSub = forkJoin([this.api.getOneResultadoAprendizaje(idRa ?? '')]).subscribe(
      ([dataRa]) => {
        this.dataRa = dataRa ? [dataRa] : [];        
        this.editForm.setValue({
          'idResultadoAprendizaje': this.dataRa[0]?.idResultadoAprendizaje || '',
          'nomResultadoAprendizaje': this.dataRa[0]?.nomResultadoAprendizaje || '',
        });
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
      title: '¿Estás seguro de que deseas modificar este saber?',
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
        const putRaSub = this.api.putResultadoAprendizaje(id).subscribe(
          (data) => {
            if (data.status == 'ok') {
              this.editForm.reset();
              this.router.navigate(['/resultados-aprendizaje']);
              Swal.fire({
                icon: 'success',
                title: 'Saber modificado',
                text: 'El saber ha sido modificado exitosamente.',
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
        this.subscriptions.add(putRaSub);
      }
    });
  }

  goBack() {
    this.router.navigate(['resultados-aprendizaje']);
  }

  
}
