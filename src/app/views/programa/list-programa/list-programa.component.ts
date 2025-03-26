import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { SharedModule } from '../../../shared/shared.module';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ProgramaService } from '../../../services/api/programa.service';
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
  selector: 'app-list-programa',
  standalone: true,
  imports: [CommonModule, SharedModule, NavigationComponent, FooterComponent],
  templateUrl: './list-programa.component.html',
  styleUrl: './list-programa.component.scss'
})
export class ListProgramaComponent implements OnInit, OnDestroy {

  private subscription: Subscription = new Subscription();

  constructor(
    private router: Router,
    private api: ProgramaService,
  ) { }

  loading: boolean = true;
  programas: any[] = [];
  nivelesFormacion: any[] = [];
  totalCompetenciasCargadas = 0;
  dataSource = new MatTableDataSource(this.programas);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;


  ngOnInit(): void {
    this.loading = true;
    const nivelFormacionSub = this.api.getNivelFormacion().subscribe(data => {
      this.nivelesFormacion = data;
      this.cargarProgramas();
    });
    this.subscription.add(nivelFormacionSub);
  }

  cargarCompetenciaPorPrograma(idPrograma: any): void {
    const proCompSub = this.api.getNomProgramaCompetencias(idPrograma).subscribe(data => {

      const competencias: any[] = data.idCompetencia
        ? data.idCompetencia.filter((programaCompetencia: any | null | undefined) => programaCompetencia !== null && programaCompetencia !== undefined)
          .map((programaCompetencia: any) => programaCompetencia.competencium!)
        : [];

      const programa = this.programas.find((p: any) => p.idPrograma === idPrograma);


      if (programa) {
        programa.competencias = competencias;
        this.totalCompetenciasCargadas++;

        if (this.totalCompetenciasCargadas === this.programas.length) {
          this.loading = false;

        }
      };
    });

    this.subscription.add(proCompSub);
  }

  cargarProgramas(): void {
    const allProgramasSub = this.api.getAllProgramas().subscribe(data => {
      if (this.nivelesFormacion.length > 0) {
        data = data.map(programa => ({ ...programa, nomNivelFormacion: this.getNivelFormacion(programa.idNivelFormacion)}));
      };
      this.programas = data;
      this.dataSource.data = this.programas;
      if (this.dataSource.data.length < 1) {
        Swal.fire({
          title: 'No hay programas registrados.',
          text: 'No se encuentran programas en el sistema.',
          icon: 'info',
          toast: true,
          showConfirmButton: false,
          timer: 5000,
          position: 'top-end',
          timerProgressBar: true,
          showCloseButton: true,
        })
      }
      if (this.programas.length > 0) {
        data.forEach((programa: any) => {
          this.cargarCompetenciaPorPrograma(programa.idPrograma);
        });
      } else {
        this.loading = false;
      };
    });
    this.subscription.add(allProgramasSub);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  newPrograma() {
    this.loading = true;
    this.router.navigate(['new-programa'])
  }
  view(id: any) {
    this.loading = true;
    this.router.navigate(['view-programa', id])
  }
  edit(id: any) {
    this.loading = true;
    this.router.navigate(['edit-programa', id])
  }

  deletePrograma(id: any): void {
    Swal.fire({
      icon: 'question',
      title: '¿Estás seguro de que deseas eliminar este programa?',
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
              title: 'Este programa está vinculado a una o más fichas. Eliminarlo resultará en la eliminación de las fichas asociadas.',
              text: '¿Estás seguro de que deseas eliminar este programa?',
              showDenyButton: true,
              showCancelButton: true,
              showConfirmButton: false,
              reverseButtons: true,
              denyButtonText: 'Eliminar',
              cancelButtonText: 'Cancelar',
            }).then((result) => {
              if (result.isDenied) {
                this.loading = true;
                this.api.deletePrograma(id).subscribe(
                  data => {
                    if (data.status == 'ok') {
                      this.programas = this.programas.filter(programa => programa.idPrograma !== id);
                      this.dataSource.data = this.programas;
                      Swal.fire({
                        icon: 'success',
                        title: 'Programa eliminado',
                        text: 'El programa ha sido eliminado exitosamente.',
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
            this.api.deletePrograma(id).subscribe(
              data => {
                if (data.status == 'ok') {
                  this.programas = this.programas.filter(programa => programa.idPrograma !== id);
                  this.dataSource.data = this.programas;
                  Swal.fire({
                    icon: 'success',
                    title: 'Programa eliminado',
                    text: 'El programa ha sido eliminado exitosamente.',
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
  };

  ngAfterViewInit() {
    this.paginator._intl.itemsPerPageLabel = 'Tus elementos por página:';
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  getNivelFormacion(idNivelFormacion: any): string {
    const nivelFormacion = this.nivelesFormacion.find(nivel => nivel.idNivelFormacion === idNivelFormacion);
    return nivelFormacion?.nomNivelFormacion || '';
  }

  generateExcel(): void {
    const dataToExport = this.programas.map(programa => ({
      'Programa': programa.nomPrograma,
      'Codigo del programa': programa.codigoPrograma,
      'Version del programa': programa.versionPrograma,
      'Red de conocimiento': programa.redConocimiento,
      'proyecto': programa.proyecto,
      'Nivel de formacion': this.getNivelFormacion(programa.idNivelFormacion),
      'Competencias': programa.competencias?.map((competencia: { nombreCompetencia: any; }) => competencia.nombreCompetencia).join(', ') || '',
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet([]);

    XLSX.utils.sheet_add_aoa(worksheet, [['Informe de Programas - Aplicativo SRA']], { origin: 'A1' });

    XLSX.utils.sheet_add_json(worksheet, dataToExport, { origin: 'A3' });

    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'programas');

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const excelFileURL = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = excelFileURL;
    link.download = 'programas.xlsx';
    link.click();
  }

  generatePDF(): void {

    const dataToExport = this.programas.map(programa => ([
      programa.nomPrograma,
      programa.codigoPrograma,
      programa.versionPrograma,
      programa.redConocimiento,
      programa.proyecto,
      this.getNivelFormacion(programa.idNivelFormacion),
      programa.competencias?.map((competencia: { nombreCompetencia: any; }) => competencia.nombreCompetencia).join(', ') || ''
    ]));

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Informe de Programas - Aplicativo SRA', 14, 15);

    doc.autoTable({
      startY: 30,
      head: [['Programa', 'Codigo del programa', 'Version del programa', 'Red de conocimiento', 'Proyecto', 'Nivel de formacion', 'Competencias']],
      body: dataToExport,
      headStyles: {
        fillColor: [57, 169, 0], // Color verde en formato RGB para los encabezados
        textColor: [255, 255, 255], // Color del texto en formato RGB para los encabezados
      },
    } as unknown as typeof AutoTableOptions); // Specify the type for options parameter

    doc.save('Programas.pdf');
  }

  removeAccents(cadena: string): string {
    return cadena.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  applyFilter(event: Event) {
    const filterValue = this.removeAccents((event.target as HTMLInputElement).value.trim().toLowerCase());
    this.dataSource.filter = filterValue.trim().toUpperCase();
  };

  siuPDF(): void {
  }


}
