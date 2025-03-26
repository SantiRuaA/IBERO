import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { SharedModule } from '../../../shared/shared.module';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subscription, forkJoin } from 'rxjs';
import Swal from 'sweetalert2';


import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import AutoTableOptions from 'jspdf-autotable';
import { NavigationComponent } from '../../../components/navigation/navigation.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ProgramacionService } from '../../../services/api/programacion.service';
import { InstructorService } from '../../../services/api/instructor.service';
import { ProgramaService } from '../../../services/api/programa.service';


@Component({
  selector: 'app-list-programacion',
  standalone: true,
  imports: [CommonModule, SharedModule, NavigationComponent, FooterComponent],
  templateUrl: './list-programacion.component.html',
  styleUrl: './list-programacion.component.scss'
})
export class ListProgramacionComponent implements OnInit, OnDestroy {

  loading: boolean = true;
  fichas: any[] = [];
  etapasFicha: any[] = [];
  tiposOferta: any[] = [];
  modalidades: any[] = [];
  instructores: any[] = [];
  programas: any[] = [];
  dataSource = new MatTableDataSource(this.fichas);

  private subcriptions: Subscription = new Subscription();

  constructor(
    private router: Router,
    private api: ProgramacionService,
    private apiInstructor: InstructorService,
    private apiPrograma: ProgramaService
  ) { }

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.loading = true;
    const frokJoinSub = forkJoin([
      this.api.getAllFichas(),
      this.apiInstructor.getAllInstructores(),
      this.apiPrograma.getAllProgramas()
    ]).subscribe(([fichas, instructores, programas]) => {
      if (instructores.length > 0) {
        instructores = instructores.map(instructor => ({ ...instructor, nombreCompleto: `${instructor.nombreInstructor} ${instructor.apellidoInstructor}` }));
      };
      this.instructores = instructores;
      this.programas = programas;
      if (fichas.length > 0) {
        fichas = fichas.map(ficha => ({ ...ficha, nombreInstructor: this.getInstructor(ficha.idInstructorTecnico), idPrograma: this.getPrograma(ficha.idPrograma) }));
      };
      this.fichas = fichas;
      this.dataSource.data = this.fichas;
      this.loading = false;
      if (this.dataSource.data.length < 1) {
        Swal.fire({
          title: 'No hay programaciones registradas.',
          text: 'No se encuentran registros en el sistema.',
          icon: 'info',
          toast: true,
          showConfirmButton: false,
          timer: 5000,
          position: 'top-end',
          timerProgressBar: true,
          showCloseButton: true,
        })
      }
    },
      error => {
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'error en el servidor.',
          text: 'Ha ocurrido un error al comunicarse con el servidor. Por favor, revisa tu conexión a internet o inténtalo nuevamente.',
          confirmButtonColor: '#39a900'
        });
      });
    this.subcriptions.add(frokJoinSub);
  }

  ngOnDestroy(): void {
    this.subcriptions.unsubscribe();
  }

  ngAfterViewInit() {
    this.paginator._intl.itemsPerPageLabel = 'Tus elementos por página:';
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  newProgramacion() {
    this.router.navigate(['/new-programacion'])
  }
  viewProgramacion(id: any) {
    this.router.navigate(['/view-programacion', id])
  }
  editProgramacion(id: any) {
    this.router.navigate(['/edit-programacion', id])
  }

  deleteProgramacion(id: any): void {
    Swal.fire({
      icon: 'question',
      title: '¿Estás seguro de que deseas eliminar la programación?',
      showDenyButton: true,
      showCancelButton: true,
      showConfirmButton: false,
      reverseButtons: true,
      denyButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isDenied) {
        this.loading = true;
        this.api.deleteFicha(id).subscribe(
          data => {
            if (data.status == 'ok') {
              this.fichas = this.fichas.filter(ficha => ficha.idFicha !== id);
              this.dataSource.data = this.fichas;
              Swal.fire({
                icon: 'success',
                title: 'Programación eliminada',
                text: 'La programación ha sido eliminada exitosamente.',
                toast: true,
                showConfirmButton: false,
                timer: 5000,
                position: 'top-end',
                timerProgressBar: true,
                showCloseButton: true,
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error al eliminar',
                text: data.msj,
                confirmButtonColor: '#39a900'
              });
            }
            this.loading = false;
          },
          error => {
            this.loading = false;
            Swal.fire({
              icon: 'error',
              title: 'Error en el servidor',
              text: 'Ha ocurrido un error al comunicarse con el servidor. Por favor, revisa tu conexión a internet o inténtalo nuevamente.',
              confirmButtonColor: '#39a900'
            });
          });
      }
    });
  };

  getInstructor(idInstructorTecnico: any): string {
    const instructor = this.instructores.find(instructor => instructor.idInstructor === idInstructorTecnico);
    return instructor?.nombreCompleto || '';
  };

  getPrograma(idPrograma: any): string {
    const programa = this.programas.find(programa => programa.idPrograma === idPrograma);
    return programa?.nomPrograma || '';
  };

  removeAccents(cadena: string): string {
    return cadena.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  applyFilter(event: Event) {
    const filterValue = this.removeAccents((event.target as HTMLInputElement).value.trim().toLowerCase());
    if (filterValue == '') {
      this.dataSource.data = this.fichas;
    } else {
      this.dataSource.data = this.fichas.filter(ficha =>
        ficha.numeroFicha.toString().includes(filterValue) ||
        this.removeAccents(ficha.idPrograma.trim().toLowerCase()).includes(filterValue) ||
        (ficha.aprendicesActivos && ficha.aprendicesActivos.includes(filterValue)) ||
        (ficha.nombreInstructor && this.removeAccents(ficha.nombreInstructor.trim().toLowerCase()).includes(filterValue)) ||
        (ficha.fechaIniLectiva && this.removeAccents(ficha.fechaIniLectiva.trim().toLowerCase()).includes(filterValue)) ||
        (ficha.fechaFinProductiva && this.removeAccents(ficha.fechaFinProductiva.trim().toLowerCase()).includes(filterValue))
      );
    };
  };

}