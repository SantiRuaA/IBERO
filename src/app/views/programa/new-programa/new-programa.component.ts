import { Component, OnDestroy, OnInit, TemplateRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { Subscription, forkJoin } from 'rxjs';
import { ProgramaService } from '../../../services/api/programa.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { MatTableDataSource } from '@angular/material/table';
import { RaService } from '../../../services/api/ra.service';
import { CompetenciaService } from '../../../services/api/competencia.service';
import { MatDialog } from '@angular/material/dialog';
import { HasUnsavedChanges } from '../../../auth/guards/unsaved-changes.guard';
import { NavigationComponent } from '../../../components/navigation/navigation.component';
import { FooterComponent } from '../../../components/footer/footer.component';

@Component({
  selector: 'app-new-programa',
  standalone: true,
  imports: [CommonModule, SharedModule, NavigationComponent, FooterComponent],
  templateUrl: './new-programa.component.html',
  styleUrl: './new-programa.component.scss'
})

export class NewProgramaComponent implements OnInit, OnDestroy, HasUnsavedChanges {

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(e: BeforeUnloadEvent) {
    if (this.hasUnsavedChanges()) {
      e.returnValue = '';
    }
  }

  private subscriptions: Subscription = new Subscription();
  nivelesFormacion: any[] = [];
  competenciasDialog: any[] = [];
  competenciasDialogOriginal: any[] = [];
  competenciasSeleccionadas: any[] = [];
  postCompetencias: any[] = [];
  idProgramaLast: any;
  resultadosAprendizaje: any[] = [];
  dataSource = new MatTableDataSource();
  loading: boolean = true;

  constructor(
    private router: Router,
    private api: ProgramaService,
    private apiCom: CompetenciaService,
    private dialog: MatDialog,
  ) { }

  @ViewChild('viewCompetenciasDialog') viewCompetenciasDialog!: TemplateRef<any>;
  
  hasUnsavedChanges(): boolean {
    this.loading = false;
    return this.newForm.dirty || this.competenciasSeleccionadas.length > 0;
  }

  newForm = new FormGroup({
    codigoPrograma: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{6,7}$')]),
    versionPrograma: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{1,3}$')]),
    nomPrograma: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z0-9 ñÑáéíóúÁÉÍÓÚ,.]{1,100}$')]),
    redConocimiento: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z0-9 ñÑáéíóúÁÉÍÓÚ,.]{1,100}$')]),
    codProyecto: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{1,7}$')]),
    proyecto: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z0-9 ñÑáéíóúÁÉÍÓÚ,.]{1,100}$')]),
    idNivelFormacion: new FormControl('', Validators.required),
  });

  ngOnInit(): void {
    this.loading = true;
    const forkJoinSub = forkJoin([
      this.api.getNivelFormacion(),
      this.apiCom.getAllCompetencias(),
    ]).subscribe(([niveles, competencias]) => {
      this.nivelesFormacion = niveles;
      this.competenciasDialog = competencias;
      this.competenciasDialogOriginal = this.competenciasDialog;
      this.dataSource.data = this.competenciasSeleccionadas;
      this.loading = false;
    });
    this.subscriptions.add(forkJoinSub);

    this.subscriptions.add(forkJoinSub);
  };

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  };
  

  postForm(form: any) {
    Swal.fire({
      icon: 'question',
      title: '¿Estás seguro de que deseas crear este programa?',
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
            title: 'Error al crear.',
            text: 'Debes asociar al menos una competencia al programa.',
            confirmButtonColor: '#39a900'
          });
          return;
        };
        const postProSub = this.api.postPrograma(form).subscribe(data => {
          if (data.status == 'ok') {
            this.newForm.reset();
            const lastIdPrograma = this.api.getLastIdPrograma().subscribe(data => {
              this.idProgramaLast = data;
              for (let i = 0; i < this.competenciasSeleccionadas.length; i++) {
                this.postCompetencias.push({ idPrograma: this.idProgramaLast, idCompetencia: this.competenciasSeleccionadas[i].idCompetencia });
                const postPromCom = this.api.postProgramaCompetencia(this.postCompetencias[i]).subscribe(
                  () => {
                    if (i == this.competenciasSeleccionadas.length - 1) {
                      this.competenciasSeleccionadas = [];
                      this.router.navigate(['programa']);
                    };
                  }
                );
                this.subscriptions.add(postPromCom);
              };
              
            });
            this.subscriptions.add(lastIdPrograma);
            Swal.fire({
              icon: 'success',
              title: 'Programa creado.',
              text: 'El programa ha sido creado correctamente.',
              showConfirmButton: false,
              toast: true,
              position: 'top-end',
              timer: 5000,
              timerProgressBar: true,
              showCloseButton: true,
            });
            
          }
          else {
            Swal.fire({
              icon: 'error',
              title: 'Error al crear.',
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
        this.subscriptions.add(postProSub);
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
    this.dataSource.data = this.competenciasSeleccionadas;
    this.competenciasDialog = this.competenciasDialog.filter(comp => comp !== competencia);
    this.competenciasDialogOriginal = this.competenciasDialogOriginal.filter(comp => comp !== competencia);
  };

  removeCompetencia(competencia: any) {
    this.competenciasDialog = [...this.competenciasDialog, competencia];
    this.competenciasDialogOriginal.push(competencia);
    this.competenciasSeleccionadas = this.competenciasSeleccionadas.filter(comp => comp !== competencia);
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
  };

}
