import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { TokenService } from '../../../../src/app/auth/token/token.service';
import Swal from 'sweetalert2';

export const isLoggedInGuard: CanMatchFn = () => {

  const tokenService = inject(TokenService);
  const router = inject(Router);

  let token = localStorage.getItem('token');

  if (token) {
    return tokenService.verifyToken(token).pipe(
      map(response => {
        if (response.status == 'ok') {
          return true;
        } else {
          router.navigate(['auth/login']);
          localStorage.removeItem('token');
          localStorage.removeItem('uid');
          Swal.fire({
            icon: 'warning',
            title: 'Su sesión ha expirado',
            text: 'Por favor inicie sesión nuevamente.',
            toast: true,
            showConfirmButton: false,
            timer: 5000,
            position: 'top-end',
            timerProgressBar: true,
            showCloseButton: true,
          })
          return false;
        }
      }),
      catchError(error => {
        Swal.fire({
          icon: 'error',
          title: 'Error en el servidor',
          text: 'Ha ocurrido un error al comunicarse con el servidor. Por favor, revisa tu conexión a internet o inténtalo nuevamente',
          toast: true,
          showConfirmButton: false,
          timer: 5000,
          position: 'top-end',
          timerProgressBar: true,
          showCloseButton: true,
        });
        return of(false);
      })
    );
  } else {
    router.navigate(['auth/login']);
    Swal.fire({
      icon: 'warning',
      title: 'Su sesión ha expirado',
      text: 'Por favor inicie sesión nuevamente.',
      toast: true,
      showConfirmButton: false,
      timer: 5000,
      position: 'top-end',
      timerProgressBar: true,
      showCloseButton: true,
    });
    return of(false);
  }
};
