import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { NavigationComponent } from '../../../components/navigation/navigation.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { Observable, Subscription, forkJoin, map, startWith } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { ProgramacionService } from '../../../services/api/programacion.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ProgramaService } from '../../../services/api/programa.service';
import { InstructorService } from '../../../services/api/instructor.service';
import Swal from 'sweetalert2';
import { CompetenciaService } from '../../../services/api/competencia.service';
import { MatOptionSelectionChange } from '@angular/material/core';

@Component({
  selector: 'app-new-programacion',
  standalone: true,
  imports: [CommonModule, SharedModule, NavigationComponent, FooterComponent],
  templateUrl: './new-programacion.component.html',
  styleUrl: './new-programacion.component.scss'
})
export class NewProgramacionComponent implements OnInit, OnDestroy {

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(e: BeforeUnloadEvent) {
    if (this.hasUnsavedChanges()) {
      e.returnValue = '';
    }
  }

  private subscriptions: Subscription = new Subscription();
  loading = true;
  etapasFicha: any[] = [];
  tiposOferta: any[] = [];
  modalidades: any[] = [];
  programas: any[] = [];
  filterPrograma: Observable<any[]> = new Observable<any[]>();
  competencias: any[] = [];
  instructores: any[] = [];
  instTecnicos: any[] = [];
  filterInstructorTecnico: Observable<any[]> = new Observable<any[]>();
  minFechaIniProductiva: string | null = '';
  minFechaFinFormacion: string | null = '';
  idFichaLast: any;
  programacion: any[] = [];
  programacionOriginal: any[] = [];
  instructorControl = new FormControl('');
  filterInstructor: Observable<any[]> = new Observable<any[]>();
  errorInstructorCompetencia: boolean = true;
  errorFechaCompetencia: boolean = true;
  postFichaCompetencia: any[] = [];
  dataSource = new MatTableDataSource();

  mostrarPrimeraParte: boolean = true;
  mostrarSegundaParte: boolean = false;
  mostrarTerceraParte: boolean = false;

  constructor(
    private router: Router,
    private api: ProgramacionService,
    private apiPro: ProgramaService,
    private apiCom: CompetenciaService,
    private apiIns: InstructorService,
  ) { }

  newForm = new FormGroup({
    numeroFicha: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{7,10}$')]),
    duracionFicha: new FormControl('', Validators.pattern('^[a-zA-Z0-9 ñÑáéíóúÁÉÍÓÚ,.]{0,20}$')),
    fechaIniLectiva: new FormControl(),
    fechaIniProductiva: new FormControl(),
    fechaFinFormacion: new FormControl(),
    cantidadAprendices: new FormControl('', Validators.pattern('^[0-9]{1,3}$')),
    idEtapaFicha: new FormControl('', Validators.required),
    idModalidad: new FormControl('', Validators.required),
    idTipoOferta: new FormControl('', Validators.required),
    idPrograma: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z0-9 ñÑáéíóúÁÉÍÓÚ,.]{1,100}$')]),
    idInstructorTecnico: new FormControl('', Validators.pattern('^[0-9]{7,15}$')),
  });

  ngOnInit(): void {
    this.loading = true;
    const forkJoininSub = forkJoin([
      this.api.getEtapaFicha(),
      this.api.getTipoOferta(),
      this.api.getModalidad(),
      this.apiPro.getAllProgramas(),
      this.apiIns.getAllInstructores(),
      this.apiIns.getAllInsTecnicos()
    ]).subscribe(([etapas, tipos, modalidades, programas, instructores, instructoresTecnicos]) => {
      this.etapasFicha = etapas;
      this.tiposOferta = tipos;
      this.modalidades = modalidades;
      this.programas = programas;
      this.instructores = instructores;
      this.instTecnicos = instructoresTecnicos;
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
    this.subscriptions.add(forkJoininSub);

    this.filterPrograma = this.newForm.get('idPrograma')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterPrograma(value || ''))
    );

    this.filterInstructorTecnico = this.newForm.get('idInstructorTecnico')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterInstructorTecnico(value || ''))
    );

    this.filterInstructor = this.instructorControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterInstructor(value))
    );

    this.newForm.get('idPrograma')!.valueChanges.subscribe((value) => {
      const program = this.programas.find(program => program.nomPrograma === value);
      if (program) {
        this.loadCompetencies(program.idPrograma);
      } else {
        this.competencias = [];
        this.programacion = [];
        this.programacionOriginal = [];
      };
    });

    this.newForm.get('fechaIniLectiva')!.valueChanges.subscribe((value) => {
      this.minFechaIniProductiva = value;
    });

    this.newForm.get('fechaIniProductiva')!.valueChanges.subscribe((value) => {
      this.minFechaFinFormacion = value;
    });
  };

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  };

  postForm(form: any) {
    Swal.fire({
      icon: 'question',
      title: '¿Estás seguro de que deseas crear la programación?',
      showCancelButton: true,
      showCloseButton: true,
      allowOutsideClick: false,
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Confirmar',
      confirmButtonColor: '#39a900',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        if (this.programacion.length < 1) {
          Swal.fire({
            icon: 'error',
            title: 'Error al registrar.',
            text: 'Debes seleccionar un programa.',
            confirmButtonColor: '#39a900'
          });
          return;
        };
        this.loading = true;
        const postFicha = this.api.postFicha(form).subscribe(data => {
          if (data.status == 'ok') {
            const lastIdFicha = this.api.getLastFicha().subscribe(data => {
              this.idFichaLast = data;
              for (let i = 0; i < this.programacion.length; i++) {
                this.postFichaCompetencia.push({
                  fechaIniCompetencia: this.programacion[i].fechaIniCompetencia,
                  fechaFinCompetencia: this.programacion[i].fechaFinCompetencia,
                  idCompetencia: this.programacion[i].idCompetencia,
                  idInstructor: this.programacion[i].idInstructor,
                  idFicha: this.idFichaLast
                });
                const postProgramacion = this.api.postProgramacion(this.postFichaCompetencia[i]).subscribe(() => {
                  if (i === this.programacion.length - 1) {
                    this.newForm.reset();
                    this.loading = false;
                    this.router.navigate(['programacion']);
                  };
                }
                );
                this.subscriptions.add(postProgramacion);
              };
            });
            this.subscriptions.add(lastIdFicha);
            Swal.fire({
              icon: 'success',
              title: 'Programación creada.',
              text: 'La programación ha sido creada correctamente.',
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
        this.subscriptions.add(postFicha);
      }
    });
  };

  hasUnsavedChanges(): boolean {
    return this.newForm.dirty
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
    if (this.newForm.get('numeroFicha')?.invalid || this.newForm.get('idEtapaFicha')?.invalid ||
      this.newForm.get('idTipoOferta')?.invalid || this.newForm.get('idModalidad')?.invalid ||
      this.newForm.get('duracionFicha')?.invalid || this.newForm.get('cantidadAprendices')?.invalid) {
      return true;
    };

    return false;
  };


  validarTerceraParteFormulario(): boolean {
    if (this.newForm.get('idPrograma')?.invalid || this.isNomProgramaInvalid(this.newForm.get('idPrograma')?.value) ||
      this.newForm.get('idInstructorTecnico')?.invalid || this.isDocInstructorTecInvalid(this.newForm.get('idInstructorTecnico')?.value) ||
      this.isFechaInvalid(this.newForm.get('fechaIniLectiva')?.value, this.newForm.get('fechaIniProductiva')?.value) ||
      this.isFechaInvalid(this.newForm.get('fechaIniLectiva')?.value, this.newForm.get('fechaFinFormacion')?.value) ||
      this.isFechaInvalid(this.newForm.get('fechaIniProductiva')?.value, this.newForm.get('fechaFinFormacion')?.value)) {
      return true;
    };

    return false;
  };

  confirmarMostrarSegundaParteFormulario() {
    this.loading = true;
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
          this.instructorControl.setValue('');
          this.mostrarSegundaParteFormulario();
          this.errorInstructorCompetencia = true;
          this.errorFechaCompetencia = true;
        };
      });
    } else {
      this.mostrarSegundaParteFormulario();
    };
    this.loading = false;
  };

  removeAccents(cadena: string): string {
    return cadena.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  private _filterPrograma(value: any) {
    const filterValue = this.removeAccents(value.toLowerCase());
    return this.programas.filter(option => {
      let nombrePrograma = this.removeAccents(option.nomPrograma);
      let codPrograma = this.removeAccents(option.codigoPrograma);
      return nombrePrograma.toLowerCase().includes(filterValue) || codPrograma.toLowerCase().includes(filterValue);
    });
  };

  private _filterInstructorTecnico(value: any) {
    const filterValue = this.removeAccents(value.toString().toLowerCase());
    return this.instTecnicos.filter(option => {
      let documentoInstructor = BigInt(option.documentoInstructor);
      let nomComplInstructor = this.removeAccents(option.nombreInstructor + ' ' + option.apellidoInstructor);
      return nomComplInstructor.toLowerCase().includes(filterValue) || documentoInstructor.toString().includes(filterValue);
    });
  };

  private _filterInstructor(value: any) {
    const filterValue = this.removeAccents(value.toString().toLowerCase());
    return this.instructores.filter(option => {
      let documentoInstructor = BigInt(option.documentoInstructor);
      let nomComplInstructor = this.removeAccents(option.nombreInstructor + ' ' + option.apellidoInstructor);
      return nomComplInstructor.toLowerCase().includes(filterValue) || documentoInstructor.toString().includes(filterValue);
    });
  };

  loadCompetencies(option: any) {
    this.loading = true;
    let x = this.apiPro.getProgramaCompetencia(option).subscribe(data => {
      this.programacion = data;
      this.programacionOriginal = JSON.parse(JSON.stringify(data));
      this.competencias = JSON.parse(JSON.stringify(data));
      for (let i = 0; i < this.competencias.length; i++) {
        let y = this.apiCom.getOneCompetencia(this.competencias[i].idCompetencia).subscribe(data => {
          this.competencias[i] = data;
          this.programacion[i].nombreCompetencia = data.nombreCompetencia;
          this.programacionOriginal[i].nombreCompetencia = data.nombreCompetencia;
        });
        this.subscriptions.add(y)
      };
      this.loading = false;
    });
    this.subscriptions.add(x);
  };

  isNomProgramaInvalid(nombrePrograma: any): boolean {
    if (nombrePrograma) {
      if (nombrePrograma.length < 1 || nombrePrograma.length > 100) return false;
      let valid = this.programas.some(programa => programa.nomPrograma === nombrePrograma);
      return !valid;
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

  getCompetenciaName(idCompetencia: number) {
    if (this.newForm.get('idPrograma')!.value === '') {
      return;
    };
    const competencia = this.competencias.find(competencia => competencia.idCompetencia === idCompetencia);
    return competencia ? competencia.nombreCompetencia : '---';
  };

  asoInstructorCompetencia(event: MatOptionSelectionChange, idProgramaCompetencia: number, documentoInstructor: number) {
    if (event.source.selected) {
      let programacionTal = this.programacion.find(comp => comp.idProgramaCompetencia === idProgramaCompetencia);
      programacionTal.idInstructor = documentoInstructor;
      programacionTal.validateInputInstructor = true;
      this.errorInstructorCompetencia = true;
    };
  };

  addFechaIniCompetencia(idProgramaCompetencia: number, event: Event) {
    let fechaIniCompetencia = (event.target as HTMLInputElement).value;
    let programacionTal = this.programacion.find(comp => comp.idProgramaCompetencia === idProgramaCompetencia);
    programacionTal.fechaIniCompetencia = fechaIniCompetencia;
    programacionTal.validateInputFechaIniCompetencia = true;
    this.validateFechaCompetencia();
  };

  addFechaFinCompetencia(idProgramaCompetencia: number, event: Event) {
    let fechaFinCompetencia = (event.target as HTMLInputElement).value;
    let programacionTal = this.programacion.find(comp => comp.idProgramaCompetencia === idProgramaCompetencia);
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
    programacion.idInstructor = null;
    let documentoInstructor = (Event.target as HTMLInputElement).value;
    if (documentoInstructor == '') {
      this.errorInstructorCompetencia = true;
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

