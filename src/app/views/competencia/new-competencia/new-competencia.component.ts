import { Component, OnDestroy, OnInit, TemplateRef,HostListener , ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CompetenciaService } from '../../../services/api/competencia.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription, forkJoin } from 'rxjs';
import Swal from 'sweetalert2';
import { SharedModule } from '../../../shared/shared.module';
import { MatDialog } from '@angular/material/dialog';
import { RaService } from '../../../services/api/ra.service';
import { MatTableDataSource } from '@angular/material/table';
import { NavigationComponent } from '../../../components/navigation/navigation.component';
import { HasUnsavedChanges } from '../../../auth/guards/unsaved-changes.guard';
import { FooterComponent } from '../../../components/footer/footer.component';


@Component({
  selector: 'app-new-competencia',
  standalone: true,
  imports: [CommonModule, SharedModule, NavigationComponent, FooterComponent],
  templateUrl: './new-competencia.component.html',
  styleUrl: './new-competencia.component.scss'
})
export class NewCompetenciaComponent implements OnInit, OnDestroy, HasUnsavedChanges {

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(e: BeforeUnloadEvent) {
    if (this.hasUnsavedChanges()) {
      e.returnValue = '';
    }
  }
  
  private subscriptions: Subscription = new Subscription();
  resultadosAprendizaje: any[] = [];
  rdaDialog: any[] = [];
  rdaDialogOriginal : any = [];
  rdaSeleccionadas: any[] = [];
  postRda: any[] = [];
  loading: boolean = true;
  idCompetencialast: any;
  dataSource = new MatTableDataSource();
  addPress: number = 0;

  constructor(
    private router: Router,
    private api: CompetenciaService,
    private apiRda: RaService,
    private dialog: MatDialog,
  ) { }

  @ViewChild('viewRdaDialog') viewRdaDialog!: TemplateRef<any>;
  hasUnsavedChanges(): boolean {
    this.loading = false;
    return this.newForm.dirty || this.rdaSeleccionadas.length > 0;
  }

  newForm = new FormGroup({
    nombreCompetencia:  new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z0-9 ñÑáéíóúÁÉÍÓÚ,.]{1,250}$')]),
    norma: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z0-9 ñÑáéíóúÁÉÍÓÚ,.]{1,500}$')]),
    codigoNorma: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{7,12}$')]),
  });

  ngOnInit(): void {
    this.loading = true;
    const forkJoinSub = forkJoin([
      this.apiRda.getAllResultadoAprendizaje(),
    ]).subscribe(([Rda]) => {
      this.rdaDialog = Rda;
      this.rdaDialogOriginal = this.rdaDialog;
      this.dataSource.data = this.rdaSeleccionadas;
      this.loading = false;
    });

    this.subscriptions.add(forkJoinSub);

  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  };

  postForm(form: any) {
    Swal.fire({
      icon: 'question',
      title: '¿Estás seguro de que deseas crear esta competencia?',
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
        if (this.rdaSeleccionadas.length < 1){
          Swal.fire({
            icon: 'error',
            title: 'Error al crear.',
            text: 'Debe seleccionar al menos un resultado de aprendizaje.',
            confirmButtonColor: '#39a900'
          });
          return;
        };
        const postComSub = this.api.postCompetencia(form).subscribe(data => {
          if (data.status == 'ok') {
            this.newForm.reset(); 
            const lastIdCompetencia = this.api.getLastIdCompetencia().subscribe(data => {
              this.idCompetencialast = data;
              for (let i = 0; i < this.rdaSeleccionadas.length; i++) {
                this.postRda.push({idCompetencia: this.idCompetencialast, idResultadoAprendizaje: this.rdaSeleccionadas[i].idResultadoAprendizaje
                });
                const u = this.api.postCompetenciaResultadoaprendizaje(this.postRda[i]).subscribe(
                  () => {
                    if (i == this.rdaSeleccionadas.length - 1) {
                      this.rdaSeleccionadas = [];
                      this.router.navigate(['competencia']);
                    };
                  }
                );
                this.subscriptions.add(u);  
              };
            });            
            this.subscriptions.add(lastIdCompetencia);
            Swal.fire({
              icon: 'success',
              title: 'Competencia creada.',
              text: 'La competencia ha sido creado correctamente.',
              showConfirmButton: false,
              toast: true,
              position: 'top-end',
              timer: 5000,
              timerProgressBar: true,
              showCloseButton: true,
            });
          } else {
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
        this.subscriptions.add(postComSub);
      }
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
  }

  addRda(rda: any ) {
    this.addPress++;
    this.rdaSeleccionadas.push(rda);
    this.dataSource.data = this.rdaSeleccionadas;
    this.rdaDialog = this.rdaDialog.filter(rd => rd !== rda);
    this.rdaDialogOriginal = this.rdaDialogOriginal.filter(rd => rd !== rda);
  };

  removeRda(rda: any) {
    this.rdaDialog = [...this.rdaDialog, rda];
    this.rdaDialogOriginal.push(rda);
    this.rdaSeleccionadas = this.rdaSeleccionadas.filter(rd => rd !== rda);
    this.dataSource.data = this.rdaSeleccionadas;
  };

  removeAccents(cadena: string):string {
    return cadena.normalize("NFC").replace(/[\u0300-\u036f]/g, "");
  };

  filterRda(event: Event): void {
    const filterRda = this.removeAccents((event.target as HTMLInputElement).value.trim().toLowerCase());
    const rdaDialogOriginal = this.rdaDialogOriginal;
    if (filterRda == '') {
      this.rdaDialog = rdaDialogOriginal;
    } else {
      this.rdaDialog = rdaDialogOriginal.filter(rd => {
        const values = Object.values(rd);
        return values.some(value =>
          this.removeAccents(String(value).toLowerCase()).includes(filterRda)
        );
      });
    };
  };
  
  goBack() {
    this.loading = true;
    this.router.navigate(['competencia']);
  };

}
