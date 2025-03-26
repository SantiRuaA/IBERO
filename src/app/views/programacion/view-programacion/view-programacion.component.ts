import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationComponent } from '../../../components/navigation/navigation.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { Subscription, forkJoin } from 'rxjs';
import { ProgramacionService } from '../../../services/api/programacion.service';
import { ProgramaService } from '../../../services/api/programa.service';
import { CompetenciaService } from '../../../services/api/competencia.service';
import { InstructorService } from '../../../services/api/instructor.service';
import { FormControl, FormGroup } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-view-programacion',
  standalone: true,
  imports: [CommonModule, SharedModule, MatTooltipModule, NavigationComponent, FooterComponent],
  templateUrl: './view-programacion.component.html',
  styleUrl: './view-programacion.component.scss'
})
export class ViewProgramacionComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription = new Subscription();
  loading = true;
  ficha: any[] = [];
  etapasFicha: any[] = [];
  tiposOferta: any[] = [];
  modalidades: any[] = [];
  programas: any[] = [];
  competencias: any[] = [];
  instructores: any[] = [];
  programacion: any[] = [];

  mostrarPrimeraParte = true;
  mostrarSegundaParte = false;
  mostrarTerceraParte = false;

  constructor(
    private router: Router,
    private api: ProgramacionService,
    private apiPro: ProgramaService,
    private apiCom: CompetenciaService,
    private apiIns: InstructorService,
    private activactedRoute: ActivatedRoute
  ) { }

  newForm = new FormGroup({
    idFicha: new FormControl(),
    numeroFicha: new FormControl(''),
    duracionFicha: new FormControl(''),
    fechaIniLectiva: new FormControl(''),
    fechaIniProductiva: new FormControl(''),
    fechaFinFormacion: new FormControl(''),
    cantidadAprendices: new FormControl(''),
    retiroAprendices: new FormControl(''),
    aprendicesActivos: new FormControl(''),
    idEtapaFicha: new FormControl(''),
    idModalidad: new FormControl(''),
    idTipoOferta: new FormControl(''),
    idPrograma: new FormControl(''),
    idInstructorTecnico: new FormControl(''),
  });

  ngOnInit() {
    this.loading = true;
    let idFicha = this.activactedRoute.snapshot.paramMap.get('id');
    const forkJoinSub = forkJoin([
      this.api.getOneFicha(idFicha),
      this.api.getEtapaFicha(),
      this.api.getTipoOferta(),
      this.api.getModalidad(),
      this.apiPro.getAllProgramas(),
      this.apiCom.getAllCompetencias(),
      this.apiIns.getAllInstructores(),
      this.api.getProgramacion(idFicha)
    ]).subscribe(([dataFicha, etapas, tipos, modalidades, programas, competencias, instructores, programacion]) => {
      this.programas = programas;
      this.instructores = instructores;
      this.etapasFicha = etapas;
      this.tiposOferta = tipos;
      this.modalidades = modalidades;
      this.ficha = dataFicha ? [dataFicha] : [];
      this.newForm.setValue({
        'idFicha': this.ficha[0]?.idFicha || '',
        'numeroFicha': this.ficha[0]?.numeroFicha || '',
        'duracionFicha': this.ficha[0]?.duracionFicha || '',
        'fechaIniLectiva': this.ficha[0]?.fechaIniLectiva || '',
        'fechaIniProductiva': this.ficha[0]?.fechaIniProductiva || '',
        'fechaFinFormacion': this.ficha[0]?.fechaFinFormacion || '',
        'cantidadAprendices': this.ficha[0]?.cantidadAprendices || '0',
        'retiroAprendices': this.ficha[0]?.retiroAprendices || '0',
        'aprendicesActivos': this.ficha[0]?.aprendicesActivos || '0',
        'idEtapaFicha': this.etapasFicha.find(etapa => etapa.idEtapaFicha === this.ficha[0]?.idEtapaFicha)?.nomEtapa || '',
        'idModalidad': this.modalidades.find(modalidad => modalidad.idModalidad === this.ficha[0]?.idModalidad)?.nomModalidad || '',
        'idTipoOferta': this.tiposOferta.find(oferta => oferta.idTipoOferta === this.ficha[0]?.idTipoOferta)?.nomTipoOferta || '',
        'idPrograma': this.programas.find(programa => programa.idPrograma === this.ficha[0]?.idPrograma)?.nomPrograma || '',
        'idInstructorTecnico': this.instructores.find(instructor => instructor.idInstructor === this.ficha[0]?.idInstructorTecnico)?.documentoInstructor || ''
      });
      this.competencias = competencias;
      if (programacion.length > 0) this.programacion = programacion;
      this.programacion.forEach((element: any) => {
        element.idInstructor = this.instructores.find(instructor => instructor.idInstructor === element.idInstructor)?.documentoInstructor || '';
      });
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
      }
    );
    this.subscriptions.add(forkJoinSub);
  };

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  };

  mostraPrimeraParteFormulario() {
    this.mostrarPrimeraParte = true;
    this.mostrarSegundaParte = false;
    this.mostrarTerceraParte = false;
  };

  mostrarSegundaParteFormulario() {
    this.mostrarPrimeraParte = false;
    this.mostrarSegundaParte = true;
    this.mostrarTerceraParte = false;
  };

  mostrarTerceraParteFormulario() {
    this.mostrarPrimeraParte = false;
    this.mostrarSegundaParte = false;
    this.mostrarTerceraParte = true;
  };

  getProgramName(nombrePrograma: string | null | undefined): string {
    if (nombrePrograma) {
      const program = this.programas.find(program => program.nomPrograma === nombrePrograma);
      return program ? program.nomPrograma : '---';
    } else {
      return '---';
    };
  };

  getCompetenciaName(idCompetencia: number): string {
    const competencia = this.competencias.find(competencia => competencia.idCompetencia === idCompetencia);
    return competencia ? competencia.nombreCompetencia : '---';
  };

  goBack() {
    this.router.navigate(['programacion']);
  };
}

