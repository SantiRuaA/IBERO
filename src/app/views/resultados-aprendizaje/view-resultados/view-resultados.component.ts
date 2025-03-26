import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { RaService } from '../../../services/api/ra.service';
import { FormControl, FormGroup } from '@angular/forms';
import { forkJoin, Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { NavigationComponent } from '../../../components/navigation/navigation.component';
import { FooterComponent } from '../../../components/footer/footer.component';


@Component({
  selector: 'app-view-resultados',
  standalone: true,
  imports: [CommonModule, SharedModule, NavigationComponent, FooterComponent],  
  templateUrl: './view-resultados.component.html',
  styleUrl: './view-resultados.component.scss'
})
export class ViewResultadosComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription = new Subscription();

  constructor(
    private activatedRouter: ActivatedRoute,
    private router:Router,
    private api: RaService
  ){}

  dataRa: any[] = [];
  loading: boolean = true;

  viewForm = new FormGroup({
    idResultadoAprendizaje: new FormControl(''),
    nomResultadoAprendizaje: new FormControl(''),
  });

  ngOnInit(): void {
    let idResultadoAprendizaje = this.activatedRouter.snapshot.paramMap.get('id');
    this.loading = true;

    const forkJoinSub = forkJoin([this.api.getOneResultadoAprendizaje(idResultadoAprendizaje ?? '')]).subscribe(
      ([dataRa]) => {
        this.dataRa = dataRa ? [dataRa] : [];
        const idResultadoAprendizaje = this.dataRa[0]?.idResultadoAprendizaje;

        this.viewForm.setValue({
          'idResultadoAprendizaje': this.dataRa[0]?.idResultadoAprendizaje || '',
          'nomResultadoAprendizaje': this.dataRa[0]?.nomResultadoAprendizaje || '',
        });
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

  goBack(){
    this.loading = true;
    this.router.navigate(['resultados-aprendizaje'])
  }

}
