import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/api/auth.service';
import { SharedModule } from '../../shared/shared.module';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-pwd',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './new-pwd.component.html',
  styleUrl: './new-pwd.component.scss'
})
export class NewPwdComponent {

  newPwdForm = new FormGroup({
    contrasenaUsuario: new FormControl('', Validators.required),
    repetirContrasena: new FormControl('', Validators.required),
  })

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {

    this.newPwdForm.get('contrasenaUsuario')?.valueChanges.subscribe(() => {
      this.passwordMatchValidator();
    });

    this.newPwdForm.get('repetirContrasena')?.valueChanges.subscribe(() => {
      this.passwordMatchValidator();
    });
  }

  loading = false;
  showPassword: boolean = false;

  passwordMatchValidator() {
    const newPassword = this.newPwdForm.get('contrasenaUsuario')?.value;
    const confirmPassword = this.newPwdForm.get('repetirContrasena')?.value;

    if (newPassword === confirmPassword) {
      this.newPwdForm.get('repetirContrasena')?.setErrors(null);
    } else {
      this.newPwdForm.get('repetirContrasena')?.setErrors({ passwordMismatch: true });
    }
  }

  onNewPwd() {
    this.loading = true;
    const newPwd = this.newPwdForm.get('contrasenaUsuario')?.value;
    const token = localStorage.getItem('token');
    this.auth.onNewPwd({ newPwd, token }).subscribe(
      data => {
        this.loading = false;
        Swal.fire({
          icon: data.status == 'ok' ? 'success' : 'error',
          title: data.status == 'ok' ? 'Contraseña actualizada' : 'Error',
          text: data.msj,
          confirmButtonColor: '#39a900',
        }).then(() => {
          if (data.status == 'ok') {
            localStorage.removeItem('token');
            this.router.navigate(['auth/login']);
          }
        });
      },
      error => {
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ha ocurrido un error al comunicarse con el servidor. Por favor, revisa tu conexión a internet o inténtalo nuevamente',
          confirmButtonColor: '#39a900'
        });
      }
    );
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  goBack() {
    this.router.navigate(['/info']);
  }

}