import { Injectable } from '@angular/core';
import { ResponseInterface } from '../../models/response.interface';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class ProgramacionService {

  url: string = 'http://localhost:3030/';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Token': token || ''
    });
  };

  getAllFichas(): Observable<any[]> {
    let address = this.url + 'ficha';
    const headers = this.getHeaders();
    return this.http.get<any[]>(address, { headers });
  }

  getOneFicha(id: any): Observable<any> {
    let address = this.url + 'ficha/' + id;
    const headers = this.getHeaders();
    return this.http.get<any>(address, { headers });
  }

  postFicha(form: any): Observable<ResponseInterface> {
    let address = this.url + 'ficha';
    const headers = this.getHeaders();
    return this.http.post<ResponseInterface>(address, form, { headers });
  }

  putFicha(id: any): Observable<ResponseInterface> {
    let address = this.url + 'ficha/' + id;
    const headers = this.getHeaders();
    return this.http.put<ResponseInterface>(address, id, { headers });
  }

  deleteFicha(id: any): Observable<ResponseInterface> {
    let addres = this.url + 'ficha/' + id;
    const headers = this.getHeaders();
    return this.http.delete<ResponseInterface>(addres, { headers });
  }

  getEtapaFicha(): Observable<any[]> {
    const address = this.url + 'etapaFicha';
    const headers = this.getHeaders();
    return this.http.get<any[]>(address, { headers });
  }

  getTipoOferta(): Observable<any[]> {
    const address = this.url + 'tipoOferta';
    const headers = this.getHeaders();
    return this.http.get<any[]>(address, { headers });
  }

  getModalidad(): Observable<any[]> {
    const address = this.url + 'modalidad';
    const headers = this.getHeaders();
    return this.http.get<any[]>(address, { headers });
  }

  getLastFicha(): Observable<any> {
    const address = this.url + 'ficha/lastIdFicha';
    const headers = this.getHeaders();
    return this.http.get<any>(address, { headers });
  }

  getProgramacion(idFicha: any): Observable<any[]> {
    const address = this.url + 'programacion/' + idFicha + '/competencias';
    const headers = this.getHeaders();
    return this.http.get<any[]>(address, { headers });
  }

  getProgramacionInstructor(idInstructor: any): Observable<any[]> {
    const address = this.url + 'programacion/' + idInstructor + '/numAprendices';
    const headers = this.getHeaders();
    return this.http.get<any[]>(address, { headers });
  }

  postProgramacion(form: any): Observable<ResponseInterface> {
    let address = this.url + 'programacion';
    const headers = this.getHeaders();
    return this.http.post<ResponseInterface>(address, form, { headers });
  }

  putProgramacion(id: any): Observable<ResponseInterface> {
    let address = this.url + 'programacion/' + id;
    const headers = this.getHeaders();
    return this.http.put<ResponseInterface>(address, id, { headers });
  }

  deleteProgramacion(id: any): Observable<ResponseInterface> {
    let addres = this.url + 'programacion/' + id;
    const headers = this.getHeaders();
    return this.http.delete<ResponseInterface>(addres, { headers });
  }
}