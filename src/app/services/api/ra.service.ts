import { Injectable } from '@angular/core';
import { ResponseInterface } from '../../models/response.interface';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class RaService {
  url: string = 'http://localhost:3030/';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Token': token || ''
    });
  }

  getAllResultadoAprendizaje(): Observable<any[]> {
    let address = this.url + 'resultadoAprendizaje';
    const headers = this.getHeaders();
    return this.http.get<any[]>(address, { headers });
  }

  getOneResultadoAprendizaje(id: string): Observable<any> {
    let address = this.url + 'resultadoAprendizaje/' + id;
    const headers = this.getHeaders();
    return this.http.get<any>(address, { headers });
  }

  getConfirmDelete(id: any): Observable<any> {
    let address = this.url + 'resultadoAprendizaje/' + id + '/confirmToDelete';
    const headers = this.getHeaders();
    return this.http.get<any>(address, {headers});
  }

  postResultadoAprendizaje(form: any): Observable<ResponseInterface> {
    let address = this.url + 'resultadoAprendizaje';
    const headers = this.getHeaders();
    return this.http.post<ResponseInterface>(address, form, { headers });
  }

  putResultadoAprendizaje(id: any): Observable<ResponseInterface> {
    let address = this.url + 'resultadoAprendizaje/' + id;
    const headers = this.getHeaders();
    return this.http.put<ResponseInterface>(address, id, { headers });
  }

  deleteResultadoAprendizaje(id: any): Observable<ResponseInterface> {
    let addres = this.url + 'resultadoAprendizaje/' + id;
    const headers = this.getHeaders();
    return this.http.delete<ResponseInterface>(addres, { headers });
  }
}