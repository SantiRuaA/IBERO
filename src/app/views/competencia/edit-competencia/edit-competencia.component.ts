import { Component, OnDestroy, OnInit, TemplateRef, HostListener, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { CompetenciaService } from '../../../services/api/competencia.service';
import { Observable, Subscription, forkJoin } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { RaService } from '../../../services/api/ra.service';
import { NavigationComponent } from '../../../components/navigation/navigation.component';
import { HasUnsavedChanges } from '../../../auth/guards/unsaved-changes.guard';
import { FooterComponent } from '../../../components/footer/footer.component';

@Component({
  selector: 'app-edit-competencia',
  standalone: true,
  imports: [CommonModule, SharedModule, NavigationComponent, FooterComponent],
  templateUrl: './edit-competencia.component.html',
  styleUrl: './edit-competencia.component.scss'
})
export class EditCompetenciaComponent implements OnDestroy, OnInit, HasUnsavedChanges {

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(e: BeforeUnloadEvent) {
    if (this.hasUnsavedChanges()) {
      e.returnValue = '';
    }
  }

  private subscriptions: Subscription = new Subscription();
  competencia: any[] = [];
  competenciaRDA: any[] = [];
  rdaDialog: any[] = [];
  competenciaAsocRda: any[] = [];
  rdaSeleccionadas: any[] = [];
  rdaDialogOriginal: any[] = [];
  rdaAdd: any[] = [];
  postRda: any[] = [];
  rdaDestroy: any[] = [];
  loading: boolean = true;
  dataSource = new MatTableDataSource();

  constructor(
    private router: Router,
    private api: CompetenciaService,
    private apiRda: RaService,
    private activatedRouter: ActivatedRoute,
    private dialog: MatDialog,
  ) { }

  @ViewChild('viewRdaDialog') viewRdaDialog!: TemplateRef<any>;
  hasUnsavedChanges(): boolean {
    return this.editForm.dirty || this.rdaAdd.length > 0 || this.rdaDestroy.length > 0;
  };

  editForm = new FormGroup({
    idCompetencia: new FormControl(),
    nombreCompetencia: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z0-9 ñÑáéíóúÁÉÍÓÚ,.]{1,100}$')]),
    norma: new FormControl('', [Validators.required]),
    codigoNorma: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{7,10}$')]),
  });

  ngOnInit(): void {
    this.loading = true;
    let idCompetencia = this.activatedRouter.snapshot.paramMap.get('id');
    const forkJoinSub = forkJoin([
      this.api.getOneCompetencia(idCompetencia),
      this.api.getCompetenciaResultadoaprendizaje(idCompetencia),
      this.api.getCompetenciaResultadoaprendizaje(idCompetencia),
      this.apiRda.getAllResultadoAprendizaje(),
      ]).subscribe(
        ([dataCompetencia, competenciaAsocRda, rdaSeleccionadas,Rda ]) => {
          this.competencia = dataCompetencia ? [dataCompetencia] : [];
          this.editForm.setValue({
            'idCompetencia': this.competencia[0]?.idCompetencia || '',
            'nombreCompetencia': this.competencia[0]?.nombreCompetencia || '',
            'norma': this.competencia[0]?.norma || '',
            'codigoNorma': this.competencia[0]?.codigoNorma || '',
          });
          this.rdaDialog = Rda;
          if (competenciaAsocRda.length > 0 && rdaSeleccionadas.length > 0) {
            this.competenciaAsocRda = competenciaAsocRda;
            this.rdaSeleccionadas = rdaSeleccionadas;
            for (let i = 0; i < this.rdaSeleccionadas.length; i++) {
              let x = this.apiRda.getOneResultadoAprendizaje(this.rdaSeleccionadas[i].idResultadoAprendizaje).subscribe(data => {
                this.rdaSeleccionadas[i] = data;
                this.dataSource.data = this.rdaSeleccionadas;
                if (i === this.rdaSeleccionadas.length - 1) {
                  this.loading = false;
                };
              });
              this.subscriptions.add(x);
            };
            
            for (let s = 0; s < this.rdaSeleccionadas.length; s++){
              for (let i = 0; i < this.rdaDialog.length; i++) {
                if (this.rdaSeleccionadas[s].idResultadoAprendizaje == this.rdaDialog[i].idResultadoAprendizaje){
                  this.rdaDialog = this.rdaDialog.filter (rda => rda !== this.rdaDialog[i]);
                  this.rdaDialogOriginal = this.rdaDialog;
                };
              };
            };
          }else{
            this.loading = false
          }
        },
        (error) => {
          this.loading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error en el servidor.',
            text: 'Ha ocurrido un error al comunicarse con el servidor. Por favor, revisa tu conexión a internet o inténtalo nuevamente.',
            confirmButtonColor: '#39a900'
          });
        }
      );
    this.subscriptions.add(forkJoinSub);
  }


  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  };

  postForm(id: any) {
    Swal.fire({
      icon: 'question',
      title: '¿Estás seguro de que deseas modificar esta competencia?',
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
        if (this.rdaSeleccionadas.length < 1) {
          Swal.fire({
            icon: 'error',
            title: 'Error al modificar',
            text: 'Debes asociar al menos un Resultado de aprendizaje a la competencia.',
            confirmButtonColor: '#39a900'
          });
          return;
        };
        const putComSub = this.api.putCompetencia(id).subscribe(data => {
          if (data.status == 'ok') {
            this.editForm.reset(); 

            const observables: Observable<any>[] = [];

            if (this.rdaAdd.length > 0) {
              const postComRdaObservables = this.rdaAdd.map((rda, i) => {
                this.postRda.push({
                  idCompetencia: id.idCompetencia,
                  idResultadoAprendizaje: rda.idResultadoAprendizaje
                });
                return this.api.postCompetenciaResultadoaprendizaje(this.postRda[i]);
              });
              observables.push(...postComRdaObservables);
            };

            if (this.rdaDestroy.length > 0) {
              const deleteComRdaObservables = this.rdaDestroy.map(rda => {
                return this.api.deleteCompetenciaRda(rda.idCompetenciaResultadoaprendizaje);
              });
              observables.push(...deleteComRdaObservables);
            };

            if (observables.length > 0) {
              forkJoin(observables).subscribe(() => {
                this.rdaAdd = [];
                this.rdaDestroy = [];
                this.router.navigate(['competencia']);
                Swal.fire({
                  icon: 'success',
                  title: 'Competencia modificada.',
                  text: 'La competencia ha sido modificada correctamente.',
                  showConfirmButton: false,
                  toast: true,
                  position: 'top-end',
                  timer: 5000,
                  timerProgressBar: true,
                  showCloseButton: true,
                });
              });
            } else {
              this.router.navigate(['competencia']);
              Swal.fire({
                icon: 'success',
                title: 'Competencia modificada.',
                text: 'La competencia ha sido modificada correctamente.',
                showConfirmButton: false,
                toast: true,
                position: 'top-end',
                timer: 5000,
                timerProgressBar: true,
                showCloseButton: true,
              });
            };
            
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error al modificar.',
              text: data.msj,
              confirmButtonColor: '#39a900'
            });
          };
          this.loading = false;
        },
          (error) => {
            this.loading = false;
            Swal.fire({
              icon: 'error',
              title: 'Error en el servidor.',
              text: 'Ha ocurrido un error al comunicarse con el servidor. Por favor, revisa tu conexión a internet o inténtalo nuevamente.',
              confirmButtonColor: '#39a900'
            });
          });
        this.subscriptions.add(putComSub);
      };
    });
  };

  viewDialogRda(): void {
    this.dialog.open(this.viewRdaDialog, {
      width: '70%',
      height: '700px',
    }).afterClosed().subscribe(() => {
      this.rdaDialog = [...this.rdaDialogOriginal];
    });
  };

  closeDialogRda(): void {
    this.dialog.closeAll();
  };

  addRda(rda: any) {
    this.rdaSeleccionadas.push(rda);
    const isRdaExist = this.competenciaAsocRda.some(rd => rd.idResultadoAprendizaje === rda.idResultadoAprendizaje);
    if (!isRdaExist) {
      this.rdaAdd.push(rda);
    };
    this.rdaDialog = this.rdaDialog.filter(rd => rd !== rda);
    this.rdaDialogOriginal = this.rdaDialogOriginal.filter(rd => rd !== rda);
    this.rdaDestroy = this.rdaDestroy.filter(rd => rd.idResultadoAprendizaje !== rda.idResultadoAprendizaje);
    this.dataSource.data = this.rdaSeleccionadas;
  };

  removeRda(rda: any) {
    this.rdaDialog = [...this.rdaDialog, rda];
    this.rdaDialogOriginal.push(rda);
    for (let i = 0; i < this.competenciaAsocRda.length; i++) {
      if (this.competenciaAsocRda[i].idResultadoAprendizaje == rda.idResultadoAprendizaje) {
        this.rdaDestroy.push(this.competenciaAsocRda[i]);
      };
    };
    this.rdaSeleccionadas = this.rdaSeleccionadas.filter(rd => rd !== rda);
    this.rdaAdd = this.rdaAdd.filter(rd => rd !== rda);
    this.dataSource.data = this.rdaSeleccionadas;
  };

  removeAccents(cadena: string): string {
    return cadena.normalize("NFC").replace(/[\u0300-\u036f]/g, "");
  };

  filterRda(event: Event): void {
    const filterRda = this.removeAccents((event.target as HTMLInputElement).value.trim().toLowerCase());
    const filterRdaDialogOriginal = this.rdaDialogOriginal;
    if (filterRda == '') {
      this.rdaDialog = filterRdaDialogOriginal;
    } else {
      this.rdaDialog = filterRdaDialogOriginal.filter(rd => {
        const values = Object.values(rd);
        return values.some(value =>
          this.removeAccents(String(value).toLowerCase()).includes(filterRda)
        );
      });
    };
  };

  goBack() {
    this.router.navigate(['competencia'])
  };
}