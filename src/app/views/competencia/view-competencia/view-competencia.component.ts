import { Subscription, forkJoin } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { CompetenciaService } from '../../../services/api/competencia.service';
import { FormControl, FormGroup } from '@angular/forms';
import Swal from 'sweetalert2';
import { NavigationComponent } from '../../../components/navigation/navigation.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { RaService } from '../../../services/api/ra.service';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-view-competencia',
  standalone: true,
  imports: [CommonModule, SharedModule,  NavigationComponent, FooterComponent],
  templateUrl: './view-competencia.component.html',
  styleUrl: './view-competencia.component.scss'
})
export class ViewCompetenciaComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription = new Subscription();



  dataCompetencia: any[] = [];
  competencia: any[] = [];
  rda: any = [];
  competenciaAsocRda: any[] = [];
  rdaDestroy: any[] = [];
  rdaSeleccionadas: any[] = [];
  rdaAdd: any[] = [];
  postRda: any[] = [];
  loading: boolean = true;
  dataSource = new MatTableDataSource();

  constructor(
    private router: Router,
    private api: CompetenciaService,
    private apiRda: RaService,
    private activatedRouter: ActivatedRoute,
  ) { }

  viewForm = new FormGroup({
    idCompetencia: new FormControl(''),
    nombreCompetencia: new FormControl(''),
    norma: new FormControl(''),
    codigoNorma: new FormControl(''),
  });

  ngOnInit(): void {
    this.loading = true;
    let idCompetencia = this.activatedRouter.snapshot.paramMap.get('id');
    const forkJoinSub = forkJoin([
      this.api.getOneCompetencia(idCompetencia),
      this.api.getCompetenciaResultadoaprendizaje(idCompetencia),
    ]).subscribe(
      ([dataCompetencia, rdaSeleccionadas]) => {
        this.dataCompetencia = dataCompetencia ? [dataCompetencia] : [];
        this.rdaSeleccionadas = rdaSeleccionadas ? rdaSeleccionadas : [];
        this.viewForm.setValue({
         'idCompetencia': this.dataCompetencia[0]?.idCompetencia || '',
          'nombreCompetencia': this.dataCompetencia[0]?.nombreCompetencia || '',
          'norma': this.dataCompetencia[0]?.norma || '',
          'codigoNorma': this.dataCompetencia[0]?.codigoNorma || '',
        });
        this.rdaSeleccionadas = rdaSeleccionadas;
        if (rdaSeleccionadas.length > 0) {
          for (let i = 0; i < this.rdaSeleccionadas.length; i++) {
            let x = this.apiRda.getOneResultadoAprendizaje(this.rdaSeleccionadas[i].idResultadoAprendizaje).subscribe(data => {
              this.rdaSeleccionadas[i] = data;
              this.dataSource.data = this.rdaSeleccionadas;
              if (i === this.rdaSeleccionadas.length - 1) {
                this.loading = false;
              };
            });
            this.subscriptions.add(x);
          }
        }else {
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
    this.router.navigate(['competencia'])
  }


}
