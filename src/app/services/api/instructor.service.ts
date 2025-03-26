import { Injectable } from '@angular/core';
import { ResponseInterface } from '../../models/response.interface';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class InstructorService {
  url: string = 'http://localhost:3030/';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Token': token || ''
    });
  }

  getAllInstructores(): Observable<any[]> {
    let address = this.url + 'instructor';
    const headers = this.getHeaders();
    return this.http.get<any[]>(address, { headers });
  }

  getAllInsTecnicos(): Observable<any[]> {
    let addres = this.url + 'instructor/tecnicos' 
    const headers = this.getHeaders();
    return this.http.get<any[]>(addres, {headers});
  }

  getOneInstructor(id: string): Observable<any> {
    let address = this.url + 'instructor/' + id;
    const headers = this.getHeaders();
    return this.http.get<any>(address, { headers });
  }

  getConfirmDelete(id: any): Observable<any> {
    let address = this.url + 'instructor/' + id + '/confirmToDelete';
    const headers = this.getHeaders();
    return this.http.get<any>(address, {headers});
  }

  postInstructor(form: any): Observable<ResponseInterface> {
    let address = this.url + 'instructor';
    const headers = this.getHeaders();
    return this.http.post<ResponseInterface>(address, form, { headers });
  }

  putInstructor(id: any): Observable<ResponseInterface> {
    let address = this.url + 'instructor/' + id;
    const headers = this.getHeaders();
    return this.http.put<ResponseInterface>(address, id, { headers });
  }

  deleteInstructor(id: any): Observable<ResponseInterface> {
    let addres = this.url + 'instructor/' + id;
    const headers = this.getHeaders();
    return this.http.delete<ResponseInterface>(addres, { headers });
  }

  getTipoDocumento(): Observable<any[]> {
    const address = this.url + 'tipodocumento';
    const headers = this.getHeaders();
    return this.http.get<any[]>(address, { headers });
  }

  getTipoInstructor(): Observable<any[]> {
    const address = this.url + 'tipoinstructor';
    const headers = this.getHeaders();
    return this.http.get<any[]>(address, { headers });
  }
}