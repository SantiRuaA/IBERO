import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { AuthService } from '../../services/api/auth.service';
import { LoginInterface } from '../../models/login.interface';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ForgotPwdComponent } from '../forgot-pwd/forgot-pwd.component';
import { MatDialog } from '@angular/material/dialog';
import { NavigationComponent } from '../../components/navigation/navigation.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, SharedModule, NavigationComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  loginForm = new FormGroup({
    correoUsuario: new FormControl('', [Validators.required, Validators.pattern('^[\\w.%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')]),
    contrasenaUsuario: new FormControl('', Validators.required)
  });

  constructor(
    private auth: AuthService,
    private dialog: MatDialog,
    private router: Router,
  ) { }

  loading = false;
  showPassword: boolean = false;
  dataUser: any = [];
  showForgotPwd: boolean = false;

  async openForgotPasswordDialog(event: Event) {
    event.preventDefault();
    this.dialog.open(ForgotPwdComponent, {
      width: '25%',
      height: 'auto',
    });
  };

  correomalo() {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'El correo ingresado no se encuentra registrado en el sistema',
      toast: true,
      showConfirmButton: false,
      timer: 5000,
      position: 'top-end',
      timerProgressBar: true,
      showCloseButton: true,
    })
  }

  onLogin(form: LoginInterface) {
    this.loading = true;
    this.auth.onLogin(form).subscribe(
      async (data) => {
        if (data.status == 'ok') {
          this.loading = true;
          localStorage.setItem("token", data.token);
          const decodedToken = JSON.parse(atob(data.token!.split('.')[1]));
          localStorage.setItem("uid", decodedToken.uid);
          await this.router.navigate(['instructor']);
          this.dataUser = data.user;
          Swal.fire({
            icon: 'success',
            title: 'Inicio de sesión exitoso',
            text: 'Bienvenido, ' + this.dataUser.nombreUsuario,
            toast: true,
            showConfirmButton: false,
            timer: 5000,
            position: 'top-end',
            timerProgressBar: true,
            showCloseButton: true,
          });
        } else {
          this.loading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: data.msj,
            toast: true,
            showConfirmButton: false,
            timer: 5000,
            position: 'top-end',
            timerProgressBar: true,
            showCloseButton: true,
          })
        }
      },
      async (error) => {
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ha ocurrido un error al comunicarse con el servidor. Por favor, revisa tu conexión a internet o inténtalo nuevamente',
          confirmButtonColor: '#39a900'
        })
      }
    );
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  goBack() {
    this.router.navigate(['/landing-component']);
  }
}
