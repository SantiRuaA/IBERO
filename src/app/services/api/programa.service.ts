import { Injectable } from '@angular/core';
import { ResponseInterface } from '../../models/response.interface';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProgramaService {

  url: string = 'http://localhost:3030/';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Token': token || ''
    });
  };

  getAllProgramas(): Observable<any[]> {
    let address = this.url + 'programa';
    const headers = this.getHeaders();
    return this.http.get<any[]>(address, { headers });
  }

  getOnePrograma(id: any): Observable<any> {
    let address = this.url + 'programa/' + id;
    const headers = this.getHeaders();
    return this.http.get<any>(address, { headers });
  }

  getConfirmDelete(id: any): Observable<any> {
    let address = this.url + 'programa/' + id + '/confirmToDelete';
    const headers = this.getHeaders();
    return this.http.get<any>(address, {headers});
  }

  postPrograma(form: any): Observable<ResponseInterface> {
    let address = this.url + 'programa';
    const headers = this.getHeaders();
    return this.http.post<ResponseInterface>(address, form, { headers });
  }

  putPrograma(id: any): Observable<ResponseInterface> {
    let address = this.url + 'programa/' + id;
    const headers = this.getHeaders();
    return this.http.put<ResponseInterface>(address, id, { headers });
  }

  deletePrograma(id: any): Observable<ResponseInterface> {
    let addres = this.url + 'programa/' + id;
    const headers = this.getHeaders();
    return this.http.delete<ResponseInterface>(addres, { headers });
  }

  getNivelFormacion(): Observable<any[]> {
    const address = this.url + 'nivelFormacion';
    const headers = this.getHeaders();
    return this.http.get<any[]>(address, { headers });
  }

  getLastIdPrograma(): Observable<any> {
    const address = this.url + 'programa/lastIdPrograma';
    const headers = this.getHeaders();
    return this.http.get<any>(address, { headers });
  }

  getProgramaCompetencia(idPrograma: any): Observable<any> {
    let address = this.url + 'programaCompetencia/' + idPrograma + '/competencias';
    const headers = this.getHeaders();
    return this.http.get<any>(address, { headers });
  }

  getNomProgramaCompetencias(idPrograma: any): Observable<any> {
    let address = this.url + 'programaCompetencia/' + idPrograma + '/nomCompetencias';
    const headers = this.getHeaders();
    return this.http.get<any>(address, { headers });
  }

  postProgramaCompetencia(programaCompetencia: any): Observable<ResponseInterface> {
    let address = this.url + 'programaCompetencia';
    const headers = this.getHeaders();
    return this.http.post<ResponseInterface>(address, programaCompetencia, { headers });
  }

  deleteProgramaCompetencia(id: any): Observable<ResponseInterface> {
    let address = this.url + 'programaCompetencia/' + id;
    const headers = this.getHeaders();
    return this.http.delete<ResponseInterface>(address, { headers });
  }
}
