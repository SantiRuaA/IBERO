import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { ProgramaService } from '../../../services/api/programa.service';
import { FormControl, FormGroup } from '@angular/forms';
import { forkJoin, Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { MatTableDataSource } from '@angular/material/table';
import { CompetenciaService } from '../../../services/api/competencia.service';
import { NavigationComponent } from '../../../components/navigation/navigation.component';
import { FooterComponent } from '../../../components/footer/footer.component';

@Component({
  selector: 'app-view-programa',
  standalone: true,
  imports: [CommonModule, SharedModule, NavigationComponent, FooterComponent],
  templateUrl: './view-programa.component.html',
  styleUrl: './view-programa.component.scss'
})
export class ViewProgramaComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription = new Subscription();
  programa: any[] = [];
  nivelesFormacion: any[] = [];
  competenciasDialog: any[] = [];
  programaAsocCompetencia: any[] = [];
  competenciasDestroy: any[] = [];
  competenciasSeleccionadas: any[] = [];
  competenciasAdd: any[] = [];
  postCompetencias: any[] = [];
  resultadosAprendizaje: any[] = [];
  loading: boolean = true;
  dataSource = new MatTableDataSource();

  constructor(
    private router: Router,
    private api: ProgramaService,
    private apiCom: CompetenciaService,
    private activatedRouter: ActivatedRoute,
  ) { }

  viewForm = new FormGroup({
    idPrograma: new FormControl(''),
    nomPrograma: new FormControl(''),
    versionPrograma: new FormControl(''),
    codigoPrograma: new FormControl(''),
    redConocimiento: new FormControl(''),
    codProyecto: new FormControl(''),
    proyecto: new FormControl(''),
    idNivelFormacion: new FormControl(''),
  });

  ngOnInit(): void {
    this.loading = true;
    let idPrograma = this.activatedRouter.snapshot.paramMap.get('id');
    const forkJoinSub = forkJoin([
      this.api.getOnePrograma(idPrograma),
      this.api.getNivelFormacion(),
      this.api.getProgramaCompetencia(idPrograma),
    ]).subscribe(
      ([dataPrograma, nivelesFormacion, competenciasSeleccionadas]) => {
        this.programa = dataPrograma ? [dataPrograma] : [];
        this.nivelesFormacion = nivelesFormacion;
        this.viewForm.setValue({
          'idPrograma': this.programa[0]?.idPrograma || '',
          'nomPrograma': this.programa[0]?.nomPrograma || '',
          'versionPrograma': this.programa[0]?.versionPrograma || '',
          'codigoPrograma': this.programa[0]?.codigoPrograma || '',
          'redConocimiento': this.programa[0]?.redConocimiento || '',
          'codProyecto': this.programa[0]?.codProyecto || '',
          'proyecto': this.programa[0]?.proyecto || '',
          'idNivelFormacion': this.nivelesFormacion.find(x => x.idNivelFormacion == this.programa[0]?.idNivelFormacion)?.nomNivelFormacion || '',
        });
        this.competenciasSeleccionadas = competenciasSeleccionadas;
        if (competenciasSeleccionadas.length > 0) {
          for (let i = 0; i < this.competenciasSeleccionadas.length; i++) {
            let x = this.apiCom.getOneCompetencia(this.competenciasSeleccionadas[i].idCompetencia).subscribe(data => {
              this.competenciasSeleccionadas[i] = data;
              this.dataSource.data = this.competenciasSeleccionadas;
              if (i === this.competenciasSeleccionadas.length - 1) {
                this.loading = false;
              };
            });
            this.subscriptions.add(x);
          };
        } else {
          this.loading = false;
        }
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

  };

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  goBack() {
    this.loading = true;
    this.router.navigate(['programa']);
  }

}
