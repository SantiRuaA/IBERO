import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { NavigationComponent } from '../../components/navigation/navigation.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { InstructorService } from '../../services/api/instructor.service';
import { ProgramacionService } from '../../services/api/programacion.service';
import { Observable, Subscription, forkJoin, map, of, switchMap } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-info',
  standalone: true,
  imports: [CommonModule, SharedModule, NavigationComponent, FooterComponent],
  templateUrl: './info.component.html',
  styleUrl: './info.component.scss'
})
export class InfoComponent implements OnInit, OnDestroy {

  constructor(
    private apiProgramacion: ProgramacionService,
    private apiInstructor: InstructorService,
    private dialog: MatDialog,
  ) { }

  @ViewChild('dialogFichas') dialogFichas!: TemplateRef<any>;
  @ViewChild('dialogCompetencias') dialogCompetencias!: TemplateRef<any>;

  private subscriptions: Subscription = new Subscription();
  welcome: boolean = true;
  instructores: any[] = [];
  tiposDocumentos: any[] = [];
  programacion: any[] = [];
  programacionOriginal: any[] = [];
  dataDialogFichas: any;
  dataDialogCompetencias: any;
  dataDialogFichasOriginal: any;
  dataDialogCompetenciasOriginal: any;
  loading: boolean = true;

  ngOnInit(): void {
    this.loading = true;
    const observables = this.apiInstructor.getAllInstructores().subscribe((data) => {
        this.instructores = data.map(data => ({...data, nombreCompleto: data.nombreInstructor + ' ' + data.apellidoInstructor}));
      let programacionObservables: any[] = [];
      if (this.instructores.length > 0) {
        programacionObservables = this.instructores.map(instructor =>
          this.apiProgramacion.getProgramacionInstructor(instructor.idInstructor)
        );
      };
      if (programacionObservables.length > 0) {
        forkJoin(programacionObservables).subscribe(programacionData => {
          this.welcome = false;
          this.programacion = programacionData;
          this.programacionOriginal = JSON.parse(JSON.stringify(this.programacion));
          console.log(this.programacion);
          this.loading = false;
        });
      } else {
        this.welcome = true;
        this.loading = false;
      }
    },
      (error) => {
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error en el servidor',
          text: 'Ha ocurrido un error al comunicarse con el servidor. Por favor, revisa tu conexión a internet o inténtalo nuevamente.',
          confirmButtonColor: '#39a900'
        });
      }
    );

    this.subscriptions.add(observables);
  };

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  };

  openDialogFichas(fichas: any[]) {
    this.dataDialogFichas = fichas;
    this.dataDialogFichasOriginal = JSON.parse(JSON.stringify(fichas));
    this.dialog.open(this.dialogFichas, {
      width: '90%',
      height: '700px',
    });
  };

  openDialogCompetencias(competencias: any[]) {
    this.dataDialogCompetencias = competencias;
    this.dataDialogCompetenciasOriginal = JSON.parse(JSON.stringify(competencias));
    this.dialog.open(this.dialogCompetencias, {
      width: '90%',
      height: '700px',
    });
  };

  closeDialog() {
    this.dialog.closeAll();
  };

  removeAccents(cadena: string): string {
    return cadena.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  filterInstructor(event: Event): void {
    const filterInstructor = this.removeAccents((event.target as HTMLInputElement).value.trim().toLowerCase());
    if (filterInstructor == '') {
      this.programacion = this.programacionOriginal;
    } else {
      this.programacion = this.programacion.filter(instructor => {
        const values = Object.values(instructor);
        return values.some(value =>
          this.removeAccents(String(value).toLowerCase()).includes(filterInstructor)
        );
      });
    };
  };

  filterFichas(event: Event): void {
    const filterFicha = this.removeAccents((event.target as HTMLInputElement).value.trim().toLowerCase());
    if (filterFicha == '') {
      this.dataDialogFichas = this.dataDialogFichasOriginal;
    } else {
      this.dataDialogFichas = this.dataDialogFichas.filter(ficha => {
        const values = Object.values(ficha);
        return values.some(value =>
          this.removeAccents(String(value).toLowerCase()).includes(filterFicha)
        );
      });
    };
  };

  filterCompetencias(event: Event): void {
    const filterCompetencia = this.removeAccents((event.target as HTMLInputElement).value.trim().toLowerCase());
    if (filterCompetencia == '') {
      this.dataDialogCompetencias = this.dataDialogCompetenciasOriginal;
    } else {
      this.dataDialogCompetencias = this.dataDialogCompetencias.filter(comp => {
        const values = Object.values(comp);
        return values.some(value =>
          this.removeAccents(String(value).toLowerCase()).includes(filterCompetencia)
        );
      });
    };
  };
}
