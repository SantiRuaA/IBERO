import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationComponent } from '../../../components/navigation/navigation.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ProgramacionService } from '../../../services/api/programacion.service';
import { ProgramaService } from '../../../services/api/programa.service';
import { CompetenciaService } from '../../../services/api/competencia.service';
import { InstructorService } from '../../../services/api/instructor.service';
import { Observable, Subscription, forkJoin, map, startWith } from 'rxjs';
import Swal from 'sweetalert2';
import { MatOptionSelectionChange } from '@angular/material/core';

@Component({
  selector: 'app-edit-programacion',
  standalone: true,
  imports: [CommonModule, SharedModule, MatTooltipModule, NavigationComponent, FooterComponent],
  templateUrl: './edit-programacion.component.html',
  styleUrl: './edit-programacion.component.scss'
})
export class EditProgramacionComponent implements OnInit, OnDestroy {

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(e: BeforeUnloadEvent) {
    if (this.hasUnsavedChanges()) {
      e.returnValue = '';
    }
  }

  private subscriptions: Subscription = new Subscription();
  loading = true;
  ficha: any[] = [];
  etapasFicha: any[] = [];
  tiposOferta: any[] = [];
  modalidades: any[] = [];
  programas: any[] = [];
  competencias: any[] = [];
  instructores: any[] = [];
  instTecnicos: any[] = [];
  filterInstructorTecnico: Observable<any[]> = new Observable<any[]>();
  minFechaIniProductiva: string | null = '';
  minFechaFinFormacion: string | null = '';
  programacion: any[] = [];
  programacionOriginal: any[] = [];
  filterInstructor: any[] = [];
  errorInstructorCompetencia: boolean = true;
  errorFechaCompetencia: boolean = true;
  putFichaCompetencia: any[] = [];

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

  editForm = new FormGroup({
    idFicha: new FormControl(),
    numeroFicha: new FormControl({ value: '', disabled: true }),
    duracionFicha: new FormControl('', Validators.pattern('^[a-zA-Z0-9 ñÑáéíóúÁÉÍÓÚ,.]{0,20}$')),
    fechaIniLectiva: new FormControl(),
    fechaIniProductiva: new FormControl(),
    fechaFinFormacion: new FormControl(),
    cantidadAprendices: new FormControl('', Validators.pattern('^[0-9]{1,3}$')),
    retiroAprendices: new FormControl('', Validators.pattern('^[0-9]{1,3}$')),
    aprendicesActivos: new FormControl({ value: '', disabled: true }),
    idEtapaFicha: new FormControl('', Validators.required),
    idModalidad: new FormControl('', Validators.required),
    idTipoOferta: new FormControl('', Validators.required),
    idPrograma: new FormControl({ value: '', disabled: true }),
    idInstructorTecnico: new FormControl('', Validators.pattern('^[0-9]{7,15}$')),
  });

  ngOnInit(): void {
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
      this.apiIns.getAllInsTecnicos(),
      this.api.getProgramacion(idFicha)
    ]).subscribe(([dataFicha, etapas, tipos, modalidades, programas, competencias, instructores, instructoresTecnicos, programacion]) => {
      this.programas = programas;
      this.instructores = instructores;
      this.instTecnicos = instructoresTecnicos;
      this.ficha = dataFicha ? [dataFicha] : [];
      this.editForm.setValue({
        'idFicha': this.ficha[0]?.idFicha || '',
        'numeroFicha': this.ficha[0]?.numeroFicha || '',
        'duracionFicha': this.ficha[0]?.duracionFicha || '',
        'fechaIniLectiva': this.ficha[0]?.fechaIniLectiva || '',
        'fechaIniProductiva': this.ficha[0]?.fechaIniProductiva || '',
        'fechaFinFormacion': this.ficha[0]?.fechaFinFormacion || '',
        'cantidadAprendices': this.ficha[0]?.cantidadAprendices || '0',
        'retiroAprendices': this.ficha[0]?.retiroAprendices || '0',
        'aprendicesActivos': this.ficha[0]?.aprendicesActivos || '0',
        'idEtapaFicha': this.ficha[0]?.idEtapaFicha || '',
        'idModalidad': this.ficha[0]?.idModalidad || '',
        'idTipoOferta': this.ficha[0]?.idTipoOferta || '',
        'idPrograma': this.programas.find(programa => programa.idPrograma === this.ficha[0]?.idPrograma)?.nomPrograma || '',
        'idInstructorTecnico': this.instructores.find(instructor => instructor.idInstructor === this.ficha[0]?.idInstructorTecnico)?.documentoInstructor || ''
      });
      this.etapasFicha = etapas;
      this.tiposOferta = tipos;
      this.modalidades = modalidades;
      this.competencias = competencias;
      if (programacion.length > 0) this.programacion = programacion;
      if (programacion) {
        this.programacion.forEach((element: any) => {
          element.validateInputInstructor = true;
          element.validateInputFechaIniCompetencia = true;
          element.validateInputFechaFinCompetencia = true;
          element.idInstructor = this.instructores.find(instructor => instructor.idInstructor === element.idInstructor)?.documentoInstructor || '';
        });
      };
      this.programacionOriginal = JSON.parse(JSON.stringify(this.programacion));
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

    this.editForm.get('cantidadAprendices')?.valueChanges.subscribe((value) => {
      if (this.editForm.get('cantidadAprendices')?.valid && value !== null && value !== '') {
        const cantidadAprendices = +value;
        if (this.editForm.get('retiroAprendices')?.valid && this.editForm.get('retiroAprendices')?.value !== null) {
          const retiroAprendices = this.editForm.get('retiroAprendices')?.value;
          const aprendicesActivos = cantidadAprendices - Number(retiroAprendices);
          this.editForm.get('aprendicesActivos')?.setValue(aprendicesActivos.toString());
        };
      } else {
        this.editForm.get('aprendicesActivos')?.setValue('0');
      };
    });

    this.editForm.get('retiroAprendices')?.valueChanges.subscribe((value) => {
      if (this.editForm.get('retiroAprendices')?.valid && value !== null) {
        const retiroAprendices = +value;
        if (this.editForm.get('cantidadAprendices')?.valid && this.editForm.get('cantidadAprendices')?.value !== null) {
          const cantidadAprendices = this.editForm.get('cantidadAprendices')?.value;
          if (retiroAprendices > Number(cantidadAprendices)) {
            return;
          };
          const aprendicesActivos = Number(cantidadAprendices) - retiroAprendices;
          this.editForm.get('aprendicesActivos')?.setValue(aprendicesActivos.toString());
        };
      };
    });

    this.filterInstructorTecnico = this.editForm.get('idInstructorTecnico')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterInstructorTecnico(value || ''))
    );

    this.editForm.get('fechaIniLectiva')!.valueChanges.subscribe((value) => {
      this.minFechaIniProductiva = value;
    });

    this.editForm.get('fechaIniProductiva')!.valueChanges.subscribe((value) => {
      this.minFechaFinFormacion = value;
    });
  };

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  };

  postForm(id: any) {
    Swal.fire({
      icon: 'question',
      title: '¿Estás seguro de que deseas modificar la programación?',
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
        const putFicha = this.api.putFicha(id).subscribe(data => {
          if (data.status == 'ok') {
            if (JSON.stringify(this.programacion) != JSON.stringify(this.programacionOriginal)) {
              for (let i = 0; i < this.programacion.length; i++) {
                this.putFichaCompetencia.push({
                  idProgramacionCompetencia: this.programacion[i].idProgramacionCompetencia,
                  fechaIniCompetencia: this.programacion[i].fechaIniCompetencia,
                  fechaFinCompetencia: this.programacion[i].fechaFinCompetencia,
                  idCompetencia: this.programacion[i].idCompetencia,
                  idInstructor: this.programacion[i].idInstructor,
                  idFicha: id.idFicha
                });
                const putProgramacion = this.api.putProgramacion(this.putFichaCompetencia[i]).subscribe(() => {
                  if (i === this.programacion.length - 1) {
                    this.editForm.reset();
                    this.loading = false;
                    this.router.navigate(['programacion']);
                    this.programacion = [];
                    this.programacionOriginal = [];
                  }
                }
                );
                this.subscriptions.add(putProgramacion);
              };
            } else {
              this.editForm.reset();
              this.loading = false;
              this.router.navigate(['programacion']);
            };
            Swal.fire({
              icon: 'success',
              title: 'Programación modificada.',
              text: 'La programación ha sido modificada correctamente.',
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
          };
        },
          (error) => {
            this.loading = false;
            Swal.fire({
              icon: 'error',
              title: 'Error en el servidor',
              text: 'Ha ocurrido un error al comunicarse con el servidor. Por favor, revisa tu conexión a internet o inténtalo nuevamente.',
              confirmButtonColor: '#39a900'
            });
          });
        this.subscriptions.add(putFicha);
      }
    });
  };

  hasUnsavedChanges(): boolean {
    return this.editForm.dirty || JSON.stringify(this.programacion) != JSON.stringify(this.programacionOriginal);
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

  validarSegundaParteFormulario(): boolean {
    if (this.editForm.get('idEtapaFicha')?.invalid || this.editForm.get('idTipoOferta')?.invalid ||
      this.editForm.get('idModalidad')?.invalid || this.editForm.get('duracionFicha')?.invalid || this.editForm.get('cantidadAprendices')?.invalid ||
      this.editForm.get('retiroAprendices')?.invalid ||
      this.isAprendicesInvalid(this.editForm.get('cantidadAprendices')?.value, this.editForm.get('retiroAprendices')?.value)) {
      return true;
    };

    return false;
  };

  validarTerceraParteFormulario(): boolean {
    if (this.editForm.get('idInstructorTecnico')?.invalid || this.isDocInstructorTecInvalid(this.editForm.get('idInstructorTecnico')?.value) ||
      this.isFechaInvalid(this.editForm.get('fechaIniLectiva')?.value, this.editForm.get('fechaIniProductiva')?.value) ||
      this.isFechaInvalid(this.editForm.get('fechaIniLectiva')?.value, this.editForm.get('fechaFinFormacion')?.value) ||
      this.isFechaInvalid(this.editForm.get('fechaIniProductiva')?.value, this.editForm.get('fechaFinFormacion')?.value)) {
      return true;
    };

    return false;
  };

  confirmarMostrarSegundaParteFormulario() {
    if (JSON.stringify(this.programacion) != JSON.stringify(this.programacionOriginal)) {
      Swal.fire({
        icon: 'question',
        title: '¿Estás seguro de que deseas regresar?',
        text: 'Si regresas, se perderán los datos del instructor y las fechas de inicio y fin de las competencias.',
        showCancelButton: true,
        showCloseButton: true,
        allowOutsideClick: false,
        cancelButtonText: 'Cancelar',
        confirmButtonText: 'Confirmar',
        confirmButtonColor: '#39a900',
        reverseButtons: true,
      }).then((result) => {
        if (result.isConfirmed) {
          this.programacion = JSON.parse(JSON.stringify(this.programacionOriginal));
          this.mostrarSegundaParteFormulario();
          this.errorInstructorCompetencia = true;
          this.errorFechaCompetencia = true;
        };
      });
    } else {
      this.mostrarSegundaParteFormulario();
    };
  };

  removeAccents(cadena: string): string {
    return cadena.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  private _filterInstructorTecnico(value: any) {
    const filterValue = this.removeAccents(value.toString().toLowerCase());
    return this.instTecnicos
      .filter(option => {
        let documentoInstructor = BigInt(option.documentoInstructor);
        let nomComplInstructor = this.removeAccents(option.nombreInstructor + ' ' + option.apellidoInstructor);
        return nomComplInstructor.toLowerCase().includes(filterValue) || documentoInstructor.toString().includes(filterValue);
      });
  };

  filterInstructorCompetencia(event: Event) {
    const documentoInstructor = (event.target as HTMLInputElement).value;
    const filterValue = this.removeAccents(documentoInstructor.toString().toLowerCase());
    this.filterInstructor = this.instructores.filter(option => {
      const documentoInstructor = BigInt(option.documentoInstructor);
      const nomComplInstructor = this.removeAccents(option.nombreInstructor + ' ' + option.apellidoInstructor);
      return nomComplInstructor.toLowerCase().includes(filterValue) || documentoInstructor.toString().includes(filterValue);
    });
  };


  isAprendicesInvalid(cantidadAprendices: any, retiroAprendices: any): boolean {
    const aprendices = Number(cantidadAprendices);
    const retirados = Number(retiroAprendices);
    if (retirados) {
      return aprendices < retirados;
    };
    return false;
  };

  isDocInstructorTecInvalid(documentoInstructor: any): boolean {
    if (documentoInstructor) {
      if (documentoInstructor.length < 7 || documentoInstructor.length > 15) return false;
      if (isNaN(documentoInstructor)) return false;
      let valid = this.instructores.some(instructor => instructor.documentoInstructor === parseInt(documentoInstructor));
      return !valid;
    };
    return false;
  };

  isFechaInvalid(fecha1: any, fecha2: any): boolean {
    if (fecha1 && fecha2) {
      return fecha1 > fecha2;
    };
    return false;
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

  asoInstructorCompetencia(event: MatOptionSelectionChange, idProgramacionCompetencia: number, documentoInstructor: number) {
    if (event.source.selected) {
      let programacionTal = this.programacion.find(comp => comp.idProgramacionCompetencia === idProgramacionCompetencia);
      programacionTal.idInstructor = documentoInstructor;
      programacionTal.validateInputInstructor = true;
      this.errorInstructorCompetencia = true;
      this.filterInstructor = [];
    };
  };

  addFechaIniCompetencia(idProgramacionCompetencia: number, event: Event) {
    let fechaIniCompetencia = (event.target as HTMLInputElement).value;
    let programacionTal = this.programacion.find(comp => comp.idProgramacionCompetencia === idProgramacionCompetencia);
    programacionTal.fechaIniCompetencia = fechaIniCompetencia;
    programacionTal.validateInputFechaIniCompetencia = true;
    this.validateFechaCompetencia();
  };

  addFechaFinCompetencia(idProgramacionCompetencia: number, event: Event) {
    let fechaFinCompetencia = (event.target as HTMLInputElement).value;
    let programacionTal = this.programacion.find(comp => comp.idProgramacionCompetencia === idProgramacionCompetencia);
    programacionTal.fechaFinCompetencia = fechaFinCompetencia;
    programacionTal.validateInputFechaFinCompetencia = true;
    this.validateFechaCompetencia();
  };

  validateDocInstructorCompetencia(Event: KeyboardEvent, programacion: any) {
    if (Event.key === 'Enter' || Event.keyCode == 13) {
      return;
    };

    this.errorInstructorCompetencia = false;
    programacion.validateInputInstructor = false;
    let documentoInstructor = (Event.target as HTMLInputElement).value;
    if (documentoInstructor == '') {
      this.errorInstructorCompetencia = true;
      programacion.idInstructor = null;
      programacion.validateInputInstructor = null;
      return;
    };
  };

  validateFechaCompetencia() {
    this.errorFechaCompetencia = true;
    this.programacion.forEach(prom => {
      if (prom.fechaIniCompetencia && prom.fechaFinCompetencia) {
        if (prom.fechaIniCompetencia > prom.fechaFinCompetencia) {
          this.errorFechaCompetencia = false;
          prom.validateInputFechaIniCompetencia = false;
          prom.validateInputFechaFinCompetencia = false;
        } else {
          prom.validateInputFechaIniCompetencia = true;
          prom.validateInputFechaFinCompetencia = true;
        };
      };
    });
  };

  goBack() {
    this.router.navigate(['programacion']);
  }
}

