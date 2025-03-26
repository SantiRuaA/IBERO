import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { InstructorService } from '../../../services/api/instructor.service';
import { Subscription, forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import AutoTableOptions from 'jspdf-autotable';
import { NavigationComponent } from '../../../components/navigation/navigation.component';
import { FooterComponent } from '../../../components/footer/footer.component';

@Component({
  selector: 'app-list-instructores',
  standalone: true,
  imports: [CommonModule, SharedModule, NavigationComponent, FooterComponent],
  templateUrl: './list-instructores.component.html',
  styleUrl: './list-instructores.component.scss'
})
export class ListInstructoresComponent implements OnInit, OnDestroy {

  constructor(
    private router: Router,
    private api: InstructorService,
  ) { }

  private subscription: Subscription = new Subscription();

  instructores: any[] = [];
  instructorFilter: any[] = [];
  tiposDocumento: any[] = [];
  tiposInstructor: any[] = [];
  dataSource = new MatTableDataSource(this.instructores);

  loading: boolean = true;
  dataToExport: any[] = [];



  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('viewInstructorDialog') viewInstructorDialog!: TemplateRef<any>;

  ngOnInit(): void {
    this.loading = true;


    const forkJoinSub = forkJoin([
      this.api.getAllInstructores(),
      this.api.getTipoDocumento(),
      this.api.getTipoInstructor()
    ]).subscribe(([instructores, tiposDocumento, tiposInstructor]) => {
      this.tiposDocumento = tiposDocumento;
      this.tiposInstructor = tiposInstructor;
      instructores = instructores.map(instructor => ({ ...instructor, nombreCompleto: `${instructor.nombreInstructor} ${instructor.apellidoInstructor}`, nombreTipoInstructor: this.getTipoInstructor(instructor.idTipoInstructor) }));
      this.instructores = instructores;
      this.dataSource.data = this.instructores;
      this.instructorFilter = this.instructores;

      if (this.dataSource.data.length < 1) {
        Swal.fire({
          title: 'No hay instructores registrados',
          text: 'No se encontraron instructores en el sistema.',
          icon: 'info',
          toast: true,
          showConfirmButton: false,
          timer: 5000,
          position: 'top-end',
          timerProgressBar: true,
          showCloseButton: true,
        })
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
    this.subscription.add(forkJoinSub);

  }

  ngAfterViewInit() {
    this.paginator._intl.itemsPerPageLabel = 'Tus elementos por página:';
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  newInstructor() {
    this.loading = true;
    this.router.navigate(['/new-instructor']);
  }

  editInstructor(id: any) {
    this.loading = true;
    this.router.navigate(['/edit-instructor', id]);
  }

  viewInstructor(id: any) {
    this.loading = true;
    this.router.navigate(['/view-instructor', id]);
  }

  deleteInstructor(id: any): void {
    Swal.fire({
      icon: 'question',
      title: '¿Estás seguro de que deseas eliminar este instructor?',
      showDenyButton: true,
      showCancelButton: true,
      showConfirmButton: false,
      reverseButtons: true,
      denyButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isDenied) {
        this.loading = true;
        const deleteSub = this.api.getConfirmDelete(id).subscribe(data => {
          this.loading = false;
          if (!data) {
            Swal.fire({
              icon: 'warning',
              title: 'Este instructor está asignado a una o más fichas como instructor técnico y/o a competencias. Si se elimina, estos campos perderán su instructor asignado.',
              text: '¿Estás seguro de que deseas eliminar este instructor?',
              showDenyButton: true,
              showCancelButton: true,
              showConfirmButton: false,
              reverseButtons: true,
              denyButtonText: 'Eliminar',
              cancelButtonText: 'Cancelar',
            }).then((result) => {
              if (result.isDenied) {
                this.loading = true;
                this.api.deleteInstructor(id).subscribe(
                  data => {
                    if (data.status == 'ok') {
                      this.instructores = this.instructores.filter(instructor => instructor.idInstructor !== id);
                      this.dataSource.data = this.instructores;
                      Swal.fire({
                        icon: 'success',
                        title: 'Instructor eliminado',
                        text: 'El instructor ha sido eliminado exitosamente.',
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
              };
            });
          } else {
            this.loading = true;
            this.api.deleteInstructor(id).subscribe(
              data => {
                if (data.status == 'ok') {
                  this.instructores = this.instructores.filter(instructor => instructor.idInstructor !== id);
                  this.dataSource.data = this.instructores;
                  Swal.fire({
                    icon: 'success',
                    title: 'Instructor eliminado',
                    text: 'El instructor ha sido eliminado exitosamente.',
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
          };
        });
        this.subscription.add(deleteSub);
      };
    });
  }

  getTipoDocumento(idTipoDocumento: any): string {
    const tipoDocumento = this.tiposDocumento.find(tipo => tipo.idTipoDocumento === idTipoDocumento);
    return tipoDocumento?.nomTipoDocumento || '';
  }

  getTipoInstructor(idTipoInstructor: any): string {
    const tipoInstructor = this.tiposInstructor.find(tipo => tipo.idTipoInstructor === idTipoInstructor);
    return tipoInstructor?.nomTipoInstructor || '';
  }

  generateExcel(): void {
    const dataToExport = this.instructores.map(instructor => ({
      'Nombre': instructor.nombreInstructor,
      'Apellido': instructor.apellidoInstructor,
      'Documento': instructor.documentoInstructor,
      'Tipo documento': this.getTipoDocumento(instructor.idTipoDocumento),
      'Teléfono': instructor.telefonoInstructor,
      'Correo electrónico': instructor.correoInstructor,
      'Tipo instructor': this.getTipoInstructor(instructor.idTipoInstructor),
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet([]);

    // Agregar el título en la celda A1
    XLSX.utils.sheet_add_aoa(worksheet, [['Informe de Instructores - Aplicativo SRA']], { origin: 'A1' });


    XLSX.utils.sheet_add_json(worksheet, dataToExport, { origin: 'A3' });

    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Instructores');

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const excelFileURL = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = excelFileURL;
    link.download = 'instructores.xlsx';
    link.click();
  }

  generatePDF(): void {

    const dataToExport = this.instructores.map(instructor => ([
      instructor.nombreInstructor,
      instructor.apellidoInstructor,
      instructor.documentoInstructor,
      this.getTipoDocumento(instructor.idTipoDocumento),
      instructor.telefonoInstructor,
      instructor.correoInstructor,
      this.getTipoInstructor(instructor.idTipoInstructor),
    ]));

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Informes de Instructores - Aplicativo SRA', 14, 15);

    doc.autoTable({
      startY: 30,
      head: [['Nombre', 'Apellido', 'Documento', 'Tipo documento', 'Teléfono', 'Correo electrónico', 'Tipo instructor']],
      body: dataToExport,
      headStyles: {
        fillColor: [57, 169, 0], // Color verde en formato RGB para los encabezados
        textColor: [255, 255, 255], // Color del texto en formato RGB para los encabezados
      },
    } as unknown as typeof AutoTableOptions); // Specify the type for options parameter

    doc.save('instructores.pdf');
  }

  removeAccents(cadena: string): string {
    return cadena.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  applyFilter(event: Event) {
    const filterValue = this.removeAccents((event.target as HTMLInputElement).value.trim().toLowerCase());
    if (filterValue == '') {
      this.dataSource.data = this.instructores;
    } else {
      this.dataSource.data = this.instructores.filter(instructor =>
        instructor.documentoInstructor.toString().includes(filterValue) ||
        instructor.telefonoInstructor.includes(filterValue) ||
        this.removeAccents(instructor.nombreCompleto.trim().toLowerCase()).includes(filterValue) ||
        this.removeAccents(instructor.correoInstructor.trim().toLowerCase()).includes(filterValue) ||
        this.removeAccents(instructor.nombreTipoInstructor.trim().toLowerCase()).includes(filterValue)
      );
    };
  };
}
