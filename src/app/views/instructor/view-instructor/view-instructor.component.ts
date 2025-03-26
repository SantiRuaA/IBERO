import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { InstructorService } from '../../../services/api/instructor.service';
import { FormControl, FormGroup } from '@angular/forms';
import { forkJoin, Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { FooterComponent } from '../../../components/footer/footer.component';
import { NavigationComponent } from '../../../components/navigation/navigation.component';

//siuuuuu

@Component({
  selector: 'app-view-instructor',
  standalone: true,
  imports: [CommonModule, SharedModule, NavigationComponent, FooterComponent],
  templateUrl: './view-instructor.component.html',
  styleUrl: './view-instructor.component.scss'
})
export class ViewInstructorComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription = new Subscription();

  constructor(
    private activatedRouter: ActivatedRoute,
    private router: Router,
    private api: InstructorService,
  ) { }

  dataInstructor: any[] = [];
  tiposDocumento: any[] = [];
  tiposInstructor: any[] = [];
  loading: boolean = true;

  viewForm = new FormGroup({
    idInstructor: new FormControl(''),
    documentoInstructor: new FormControl(''),
    idTipoDocumento: new FormControl(''),
    nombreInstructor: new FormControl(''),
    apellidoInstructor: new FormControl(''),
    telefonoInstructor: new FormControl(''),
    correoInstructor: new FormControl(''),
    idTipoInstructor: new FormControl(''),
  });

  ngOnInit(): void {
    let idInstructor = this.activatedRouter.snapshot.paramMap.get('id');
    this.loading = true;

    const forkJoinSub = forkJoin([this.api.getOneInstructor(idInstructor ?? ''), this.api.getTipoDocumento(), this.api.getTipoInstructor()]).subscribe(
      ([dataInstructor, tiposDocumento, tiposInstructor]) => {
        this.dataInstructor = dataInstructor ? [dataInstructor] : [];
        this.tiposDocumento = tiposDocumento ? tiposDocumento : [];
        this.tiposInstructor = tiposInstructor ? tiposInstructor : [];
        const idTipoDocumento = this.dataInstructor[0]?.idTipoDocumento;
        const tipoDocumento = this.tiposDocumento.find((tipoDocumento) => tipoDocumento.idTipoDocumento === idTipoDocumento);
        const idTipoInstructor = this.dataInstructor[0]?.idTipoInstructor;
        const tipoInstructor = this.tiposInstructor.find((tipoInstructor) => tipoInstructor.idTipoInstructor === idTipoInstructor);
        this.viewForm.setValue({
          'idInstructor': this.dataInstructor[0]?.idInstructor || '',
          'documentoInstructor': this.dataInstructor[0]?.documentoInstructor || '',
          'idTipoDocumento': tipoDocumento?.nomTipoDocumento || '',
          'nombreInstructor': this.dataInstructor[0]?.nombreInstructor || '',
          'apellidoInstructor': this.dataInstructor[0]?.apellidoInstructor || '',
          'telefonoInstructor': this.dataInstructor[0]?.telefonoInstructor || '',
          'correoInstructor': this.dataInstructor[0]?.correoInstructor || '',
          'idTipoInstructor': tipoInstructor?.nomTipoInstructor || '',
        });
        this.tiposDocumento = tiposDocumento;
        this.tiposInstructor = tiposInstructor;
        this.loading = false;
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
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  goBack() {
    this.loading = true;
    this.router.navigate(['/instructor']);
  }
}
