import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ResponseInterface } from '../../models/response.interface';

@Injectable({
  providedIn: 'root'
})
export class CompetenciaService {
  url: string = 'http://localhost:3030/';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {

    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Token': token || ''
    });

  }

  getAllCompetencias(): Observable<any[]> {
    let adress = this.url + 'competencia';
    const headers = this.getHeaders();
    return this.http.get<any[]>(adress, { headers });
  }

  getOneCompetencia(id: any): Observable<any> {
    let address = this.url + 'competencia/' + id;
    const headers = this.getHeaders();
    return this.http.get<any>(address, { headers });
  }

  getConfirmDelete(id: any): Observable<any> {
    let address = this.url + 'competencia/' + id + '/confirmToDelete';
    const headers = this.getHeaders();
    return this.http.get<any>(address, {headers});
  }

  postCompetencia(form: any): Observable<ResponseInterface> {
    let address = this.url + 'competencia';
    const headers = this.getHeaders();
    return this.http.post<ResponseInterface>(address, form, { headers });
  }

  putCompetencia(id: any): Observable<ResponseInterface> {
    let address = this.url + 'competencia/' + id;
    const headers = this.getHeaders();
    return this.http.put<ResponseInterface>(address, id, { headers });
  }

  deleteCompetencia(id: any): Observable<ResponseInterface> {
    let address = this.url + 'competencia/' + id;
    const headers = this.getHeaders();
    return this.http.delete<ResponseInterface>(address, { headers });
  }
  getLastIdCompetencia(): Observable<any> {
    const address = this.url + 'competencia/lastIdCompetencia'
    const headers = this.getHeaders();
    return this.http.get<any>(address, { headers });
  }

  getCompetenciaResultadoaprendizaje(idCompetencia: any): Observable<any> {
    let address = this.url + 'competenciaRda/' + idCompetencia + '/Rda';
    const headers = this.getHeaders();
    return this.http.get<any>(address, { headers });
  }

  getNomCompetenciaResultadoaprendizaje(idCompetencia: any): Observable<any> {
    let address = this.url + 'competenciaRda/' + idCompetencia + '/nomRda';
    const headers = this.getHeaders();
    return this.http.get<any>(address, { headers });
  }

  postCompetenciaResultadoaprendizaje(competenciaRda: any): Observable<ResponseInterface> {
    let address = this.url + 'competenciaRda';
    const headers = this.getHeaders();
    return this.http.post<ResponseInterface>(address, competenciaRda, { headers });
  }

  deleteCompetenciaRda(id: any): Observable<ResponseInterface> {
    let address = this.url + 'competenciaRda/' + id;
    const headers = this.getHeaders();
    return this.http.delete<ResponseInterface>(address, { headers });
  }

}