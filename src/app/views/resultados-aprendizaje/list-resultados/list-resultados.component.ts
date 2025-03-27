import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { RaService } from '../../../services/api/ra.service';
import { Subscription, forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import AutoTableOptions from 'jspdf-autotable';
import { NavigationComponent } from '../../../components/navigation/navigation.component';
import { FooterComponent } from '../../../components/footer/footer.component';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: typeof AutoTableOptions) => jsPDF;
  }
}

@Component({
  selector: 'app-list-resultados',
  standalone: true,
  imports: [CommonModule, SharedModule, NavigationComponent, FooterComponent],
  templateUrl: './list-resultados.component.html',
  styleUrl: './list-resultados.component.scss'
})
export class ListResultadosComponent implements OnInit, OnDestroy {
  constructor(
    private router: Router,
    private api: RaService,
  ) { }

  private subscription: Subscription = new Subscription();

  resultados: any[] = [];
  dataSource = new MatTableDataSource(this.resultados);
  loading: boolean = true;
  dataToExport: any[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('viewInstructorDialog') viewInstructorDialog!: TemplateRef<any>;

  ngOnInit(): void {
    const forkJoinSub = forkJoin([
      this.api.getAllResultadoAprendizaje(),
    ]).subscribe(([resultados]) => {
      this.resultados = resultados;
      this.dataSource.data = this.resultados;
      if (this.dataSource.data.length < 1) {
        Swal.fire({
          title: 'No hay resultados de aprendizaje registrados',
          text: 'No se encontraron resultados de aprendizaje en el sistema.',
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

  newResultado() {
    this.loading = true;
    this.router.navigate(['/new-resultados']);
  }

  viewResultado(id: any) {
    this.loading = true;
    this.router.navigate(['/view-resultado', id])
  }

  editResultado(id: any) {
    this.loading = true;
    this.router.navigate(['/edit-resultado', id])
  }

  deleteResultado(id: any) {
    Swal.fire({
      icon: 'question',
      title: '¿Estás seguro de que deseas eliminar este saber?',
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
              title: 'El saber está vinculado a una o más competencias. Si se elimina, se removera el resultado de aprendizaje de las competencias asociados.',
              text: '¿Estás seguro de que deseas eliminar este resultado de aprendizaje?',
              showDenyButton: true,
              showCancelButton: true,
              showConfirmButton: false,
              reverseButtons: true,
              denyButtonText: 'Eliminar',
              cancelButtonText: 'Cancelar',
            }).then((result) => {
              if (result.isDenied) {
                this.loading = true;
                this.api.deleteResultadoAprendizaje(id).subscribe(
                  data => {
                    if (data.status == 'ok') {
                      this.resultados = this.resultados.filter(resultado => resultado.idResultadoAprendizaje !== id);
                      this.dataSource.data = this.resultados;
                      Swal.fire({
                        icon: 'success',
                        title: 'Saber eliminado',
                        text: 'El saber ha sido eliminado exitosamente.',
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
            this.api.deleteResultadoAprendizaje(id).subscribe(
              data => {
                if (data.status == 'ok') {
                  this.resultados = this.resultados.filter(resultado => resultado.idResultadoAprendizaje !== id);
                  this.dataSource.data = this.resultados;
                  Swal.fire({
                    icon: 'success',
                    title: 'Saber eliminado',
                    text: 'El saber ha sido eliminado exitosamente.',
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
      }
    });
  }


  generateExcel(): void {
    const dataToExport = this.resultados.map(resultado => ({
      'Resultado de aprendizaje': resultado.nomResultadoAprendizaje,
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet([]);

    XLSX.utils.sheet_add_aoa(worksheet, [['Informes de Resultados de aprendizaje - Aplicativo SRA']], { origin: 'A1' });

    XLSX.utils.sheet_add_json(worksheet, dataToExport, { origin: 'A3' });

    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet);

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const excelFileURL = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = excelFileURL;
    link.download = 'RAP.xlsx';
    link.click();
  }


  generatePDF(): void {

    const dataToExport = this.resultados.map(resultado => ([
      resultado.nomResultadoAprendizaje,
    ]));

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Informes de Resultados de aprendizaje - Aplicativo SRA', 14, 22);

    doc.autoTable({
      startY: 30,
      head: [['Resultado de aprendizaje']],
      body: dataToExport,
      headStyles: {
        fillColor: [57, 169, 0], // Color verde en formato RGB para los encabezados
        textColor: [255, 255, 255], // Color del texto en formato RGB para los encabezados
      },
    } as unknown as typeof AutoTableOptions); // Specify the type for options parameter

    doc.save('RAP.pdf');
  }

  removeAccents(cadena: string): string {
    return cadena.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  applyFilter(event: Event) {
    const filterValue = this.removeAccents((event.target as HTMLInputElement).value.trim().toLowerCase());
    this.dataSource.filter = filterValue.trim().toUpperCase();
  };

}

