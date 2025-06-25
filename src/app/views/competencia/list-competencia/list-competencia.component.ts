import { NewCompetenciaComponent } from './../new-competencia/new-competencia.component';
import { Component, ViewChild, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { SharedModule } from '../../../shared/shared.module';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { CompetenciaService } from '../../../services/api/competencia.service';
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
  selector: 'app-list-competencia',
  standalone: true,
  imports: [CommonModule, SharedModule, NavigationComponent, FooterComponent],
  templateUrl: './list-competencia.component.html',
  styleUrl: './list-competencia.component.scss'
})

export class ListCompetenciaComponent implements OnInit, OnDestroy {

  competencias: any[] = [];
  dataSource = new MatTableDataSource(this.competencias);
  loading: boolean = true;
  totalRdaCargados = 0;


  private subcriptions: Subscription = new Subscription();

  constructor(
    private router: Router,
    private api: CompetenciaService,
  ) { }

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.loading = true;
    this.cargarCompetencia();
    const frokJoinSub = forkJoin([
      this.api.getAllCompetencias()
    ]).subscribe(([competencias]) => {
      this.competencias = competencias;
      this.dataSource.data = this.competencias;
      if (this.dataSource.data.length < 1) {
        Swal.fire({
          title: 'No hay competencias registrados.',
          text: 'No se encuentran competencias en el sistema.',
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
          title: 'error en el servidor.',
          text: 'Ha ocurrido un error al comunicarse con el servidor. Por favor, revisa tu conexión a internet o inténtalo nuevamente.',
          confirmButtonColor: '#39a900'
        });
      });
    this.subcriptions.add(frokJoinSub);
  }

  cargarRdaCompetencia(idCompetencia: any): void {
    const rdaSub = this.api.getNomCompetenciaResultadoaprendizaje(idCompetencia).subscribe(data => {

      const rda: any[] = data.idRDA
        ? data.idRDA.filter((competenciaRda: any | null | undefined) => competenciaRda !== null && competenciaRda !== undefined)
          .map((competenciaRda: any) => competenciaRda.resultadoaprendizaje!)
        : [];

      const competencia = this.competencias.find((c: any) => c.idCompetencia === idCompetencia);

      if (competencia) {
        competencia.rda = rda;

        this.totalRdaCargados++;

        if (this.totalRdaCargados === this.competencias.length) {
          this.loading = false;
        }
      }

    });
    this.subcriptions.add(rdaSub);
  }

  cargarCompetencia(): void {
    const allCompetenciasSub = this.api.getAllCompetencias().subscribe(data => {
      this.competencias = data;
      this.dataSource.data = this.competencias;
      if (this.dataSource.data.length < 1) {
        Swal.fire({
          title: 'No hay competencias registradas.',
          text: 'No se encuentran competencias en el sistema.',
          icon: 'info',
          toast: true,
          showConfirmButton: false,
          timer: 5000,
          position: 'top-end',
          timerProgressBar: true,
          showCloseButton: true,
        })
      }
      if (this.competencias.length > 0) {
        data.forEach((competencia: any) => {
          this.cargarRdaCompetencia(competencia.idCompetencia);
        });
      }
    });
    this.subcriptions.add(allCompetenciasSub);
  }


  ngAfterViewInit() {
    this.paginator._intl.itemsPerPageLabel = 'Tus elementos por página:';
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.subcriptions.unsubscribe();
  }


  newCompetencia() {
    this.loading = true;
    this.router.navigate(['new-competencia'])
  }
  view(id: any) {
    this.loading = true;
    this.router.navigate(['view-competencia', id])
  }
  edit(id: any) {
    this.loading = true;
    this.router.navigate(['edit-competencia', id])
  }

  deleteCompetencia(id: any): void {
    Swal.fire({
      icon: 'question',
      title: '¿Estás seguro de que deseas eliminar esta competencia?',
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
              title: 'La competencia está vinculada a uno o más programas. Si se elimina, se removera la competencia de los programas asociados.',
              text: '¿Estás seguro de que deseas eliminar esta competencia?',
              showDenyButton: true,
              showCancelButton: true,
              showConfirmButton: false,
              reverseButtons: true,
              denyButtonText: 'Eliminar',
              cancelButtonText: 'Cancelar',
            }).then((result) => {
              if (result.isDenied) {
                this.loading = true;
                this.api.deleteCompetencia(id).subscribe(
                  data => {
                    if (data.status == 'ok') {
                      this.competencias = this.competencias.filter(competencia => competencia.idCompetencia !== id);
                      this.dataSource.data = this.competencias;
                      Swal.fire({
                        icon: 'success',
                        title: 'competencia eliminado',
                        text: 'La competencia ha sido eliminado exitosamente.',
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
            this.api.deleteCompetencia(id).subscribe(
              data => {
                if (data.status == 'ok') {
                  this.competencias = this.competencias.filter(competencia => competencia.idCompetencia !== id);
                  this.dataSource.data = this.competencias;
                  Swal.fire({
                    icon: 'success',
                    title: 'competencia eliminado',
                    text: 'El competencia ha sido eliminada exitosamente.',
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
        this.subcriptions.add(deleteSub);
      }
    });
  }

  generateExcel(): void {
    const dataToExport = this.competencias.map(competencia => ({
      'Competencia': competencia.nombreCompetencia,
      'Norma': competencia.norma,
      'Codigo de la norma': competencia.codigoNorma,
      'RAP': competencia.rda?.map((rda: { nomResultadoAprendizaje: any; }) => rda.nomResultadoAprendizaje).join(', ') || '',
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet([]);

    XLSX.utils.sheet_add_aoa(worksheet, [['Informe de Materias - Aplicativo IBERO']], { origin: 'A1' });

    XLSX.utils.sheet_add_json(worksheet, dataToExport, { origin: 'A3' });

    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Materias');

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const excelFileURL = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = excelFileURL;
    link.download = 'Materias.xlsx';
    link.click();
  }


  generatePDF(): void {

    const dataToExport = this.competencias.map(competencia => ([
      competencia.nombreCompetencia,
      competencia.norma,
      competencia.codigoNorma,
      competencia.rda?.map((rda: { nomResultadoAprendizaje: any; }) => rda.nomResultadoAprendizaje).join(', ') || '',
    ]));

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Informe de Materias - Aplicativo IBERO', 14, 15);

    doc.autoTable({
      startY: 30,
      head: [['Competencia', 'Norma ', 'Codigo de la norma ', 'RAP ']],
      body: dataToExport,
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
      },
    } as unknown as typeof AutoTableOptions);

    doc.save('Materias.pdf');
  }


  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toUpperCase();
  }

}