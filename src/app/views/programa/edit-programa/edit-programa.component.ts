import { Component, OnDestroy, OnInit, TemplateRef, HostListener, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { Observable, Subscription, forkJoin } from 'rxjs';
import { ProgramaService } from '../../../services/api/programa.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { CompetenciaService } from '../../../services/api/competencia.service';
import { NavigationComponent } from '../../../components/navigation/navigation.component';
import { HasUnsavedChanges } from '../../../auth/guards/unsaved-changes.guard';
import { FooterComponent } from '../../../components/footer/footer.component';

@Component({
  selector: 'app-edit-programa',
  standalone: true,
  imports: [CommonModule, SharedModule, NavigationComponent, FooterComponent],
  templateUrl: './edit-programa.component.html',
  styleUrl: './edit-programa.component.scss'
})
export class EditProgramaComponent implements OnDestroy, OnInit, HasUnsavedChanges {

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(e: BeforeUnloadEvent) {
    if (this.hasUnsavedChanges()) {
      e.returnValue = '';
    }
  }

  private subscriptions: Subscription = new Subscription();
  programa: any[] = [];
  nivelesFormacion: any[] = [];
  competenciasDialog: any[] = [];
  competenciasDialogOriginal: any[] = [];
  programaAsocCompetencia: any[] = [];
  competenciasDestroy: any[] = [];
  competenciasSeleccionadas: any[] = [];
  competenciasAdd: any[] = [];
  postCompetencias: any[] = [];
  resultadosAprendizaje: any[] = [];
  dataSource = new MatTableDataSource();
  loading: boolean = true;

  constructor(
    private router: Router,
    private api: ProgramaService,
    private apiCom: CompetenciaService,
    private activatedRouter: ActivatedRoute,
    private dialog: MatDialog,
  ) { };

  @ViewChild('viewCompetenciasDialog') viewCompetenciasDialog!: TemplateRef<any>;

  editForm = new FormGroup({
    idPrograma: new FormControl(),
    codigoPrograma: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{6,7}$')]),
    versionPrograma: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{1,3}$')]),
    nomPrograma: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z0-9 ñÑáéíóúÁÉÍÓÚ,.]{1,100}$')]),
    redConocimiento: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z0-9 ñÑáéíóúÁÉÍÓÚ,.]{1,100}$')]),
    codProyecto: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{1,7}$')]),
    proyecto: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z0-9 ñÑáéíóúÁÉÍÓÚ,.]{1,100}$')]),
    idNivelFormacion: new FormControl('', Validators.required),

  });

  hasUnsavedChanges(): boolean {
    this.loading = false;
    return this.editForm.dirty || this.competenciasAdd.length > 0 || this.competenciasDestroy.length > 0;
  }

  ngOnInit(): void {
    this.loading = true;
    let idPrograma = this.activatedRouter.snapshot.paramMap.get('id');
    const forkJoinSub = forkJoin([
      this.api.getOnePrograma(idPrograma),
      this.api.getNivelFormacion(),
      this.api.getProgramaCompetencia(idPrograma),
      this.api.getProgramaCompetencia(idPrograma),
      this.apiCom.getAllCompetencias(),
    ]).subscribe(
      ([dataPrograma, nivelesFormacion, programaAsocCompetencia, competenciasSeleccionadas, competencias]) => {
        this.programa = dataPrograma ? [dataPrograma] : [];
        this.editForm.setValue({
          'idPrograma': this.programa[0]?.idPrograma || '',
          'codigoPrograma': this.programa[0]?.codigoPrograma || '',
          'versionPrograma': this.programa[0]?.versionPrograma || '',
          'nomPrograma': this.programa[0]?.nomPrograma || '',
          'redConocimiento': this.programa[0]?.redConocimiento || '',
          'codProyecto': this.programa[0]?.codProyecto || '',
          'proyecto': this.programa[0]?.proyecto || '',
          'idNivelFormacion': this.programa[0]?.idNivelFormacion || '',
        });
        this.nivelesFormacion = nivelesFormacion;
        this.competenciasDialog = competencias;
        if (programaAsocCompetencia.length > 0 && competenciasSeleccionadas.length > 0) {
          this.programaAsocCompetencia = programaAsocCompetencia;
          this.competenciasSeleccionadas = competenciasSeleccionadas;
          for (let i = 0; i < this.competenciasSeleccionadas.length; i++) {
            let x = this.apiCom.getOneCompetencia(this.competenciasSeleccionadas[i].idCompetencia).subscribe(data => {
              this.competenciasSeleccionadas[i] = data;
              this.dataSource.data = this.competenciasSeleccionadas;
              if (i == this.competenciasSeleccionadas.length - 1) {
                this.loading = false;
              };
            });
            this.subscriptions.add(x);
          };
          for (let j = 0; j < this.competenciasSeleccionadas.length; j++) {
            for (let i = 0; i < this.competenciasDialog.length; i++) {
              if (this.competenciasSeleccionadas[j].idCompetencia == this.competenciasDialog[i].idCompetencia) {
                this.competenciasDialog = this.competenciasDialog.filter(comp => comp !== this.competenciasDialog[i]);
                this.competenciasDialogOriginal = this.competenciasDialog;
              };
            };
          };
        }else { 
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
  };

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  };

  postForm(id: any) {
    Swal.fire({
      icon: 'question',
      title: '¿Estás seguro de que deseas modificar este programa?',
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
        if (this.competenciasSeleccionadas.length < 1) {
          Swal.fire({
            icon: 'error',
            title: 'Error al modificar.',
            text: 'Debes asociar al menos una competencia al programa.',
            confirmButtonColor: '#39a900'
          });
          return;
        };
        const putProSub = this.api.putPrograma(id).subscribe(data => {
          if (data.status == 'ok') {
            this.editForm.reset();

            const observables: Observable<any>[] = [];
            if (this.competenciasAdd.length > 0) {
              const putPromComObservable = this.competenciasAdd.map((competencia, i) => {
                this.postCompetencias.push({
                  idPrograma: id.idPrograma,
                  idCompetencia: competencia.idCompetencia
                });
                return this.api.postProgramaCompetencia(this.postCompetencias[i]);
              });
              observables.push(...putPromComObservable);
            };

            if (this.competenciasDestroy.length > 0) {
              const deletePromComObservable = this.competenciasDestroy.map((competencia) => {
                return this.api.deleteProgramaCompetencia(competencia.idProgramaCompetencia);
              });
              observables.push(...deletePromComObservable);
            };

            if (observables.length > 0) {
              forkJoin(observables).subscribe(() => {
                this.competenciasAdd = [];
                this.competenciasDestroy = [];
                this.router.navigate(['programa']);
                Swal.fire({
                  icon: 'success',
                  title: 'Programa modificado.',
                  text: 'El programa ha sido modificado correctamente.',
                  showConfirmButton: false,
                  toast: true,
                  position: 'top-end',
                  timer: 5000,
                  timerProgressBar: true,
                  showCloseButton: true,
                });
              });
            } else {
              this.router.navigate(['programa']);
              this.competenciasAdd = [];
              this.competenciasDestroy = [];
              Swal.fire({
                icon: 'success',
                title: 'Programa modificado.',
                text: 'El programa ha sido modificado correctamente.',
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
          }
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
        this.subscriptions.add(putProSub);
      }
    });
  };

  viewDialogCompetencias(): void {
    this.dialog.open(this.viewCompetenciasDialog, {
      width: '70%',
      height: '700px',
    }).afterClosed().subscribe(() => {
      this.competenciasDialog = [...this.competenciasDialogOriginal];
    });
  };

  closeDialogCompetencias(): void {
    this.dialog.closeAll();
  };

  addCompetencia(competencia: any) {
    this.competenciasSeleccionadas.push(competencia);
    const isCompetenciaExist = this.programaAsocCompetencia.some(comp => comp.idCompetencia === competencia.idCompetencia);
    if (!isCompetenciaExist) {
      this.competenciasAdd.push(competencia);
    };
    this.competenciasDialog = this.competenciasDialog.filter(comp => comp !== competencia);
    this.competenciasDialogOriginal = this.competenciasDialogOriginal.filter(comp => comp !== competencia);
    this.competenciasDestroy = this.competenciasDestroy.filter(comp => comp.idCompetencia !== competencia.idCompetencia);
    this.dataSource.data = this.competenciasSeleccionadas;
  };

  removeCompetencia(competencia: any) {
    this.competenciasDialog = [...this.competenciasDialog, competencia];
    this.competenciasDialogOriginal.push(competencia);
    for (let i = 0; i < this.programaAsocCompetencia.length; i++) {
      if (this.programaAsocCompetencia[i].idCompetencia == competencia.idCompetencia) {
        this.competenciasDestroy.push(this.programaAsocCompetencia[i]);
      };
    };
    this.competenciasSeleccionadas = this.competenciasSeleccionadas.filter(comp => comp !== competencia);
    this.competenciasAdd = this.competenciasAdd.filter(comp => comp !== competencia);
    this.dataSource.data = this.competenciasSeleccionadas;
  };


  removeAccents(cadena: string): string {
    return cadena.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  filterCompetencias(event: Event): void {
    const filterCompetencia = this.removeAccents((event.target as HTMLInputElement).value.trim().toLowerCase());
    const competenciasDialogOriginal = this.competenciasDialogOriginal;
    if (filterCompetencia == '') {
      this.competenciasDialog = competenciasDialogOriginal;
    } else {
      this.competenciasDialog = competenciasDialogOriginal.filter(comp => {
        const values = Object.values(comp);
        return values.some(value =>
          this.removeAccents(String(value).toLowerCase()).includes(filterCompetencia)
        );
      });
    };
  };

  goBack() {
    this.loading = true;
    this.router.navigate(['programa']);
  }

}
