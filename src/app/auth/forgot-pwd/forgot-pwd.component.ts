import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { SharedModule } from '../../shared/shared.module';
import { AuthService } from '../../services/api/auth.service';

@Component({
  selector: 'app-forgot-pwd',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './forgot-pwd.component.html',
  styleUrl: './forgot-pwd.component.scss'
})
export class ForgotPwdComponent {

  constructor(
    private auth: AuthService,
    public dialogRef: MatDialogRef<ForgotPwdComponent>
  ) { }

  loading: boolean = false;

  forgotForm = new FormGroup({
    correoUsuario: new FormControl('', [Validators.required]),
  })

  forgotPwd(form: any) {
    this.loading = true;
    this.auth.onForgotPassword(form).subscribe(data => {
      this.loading = false;
      Swal.fire({
        icon: data.status == 'ok' ? 'success' : 'error',
        title: data.status == 'ok' ? 'Revisa tu correo' : 'Error',
        text: data.msj,
        confirmButtonColor: '#39a900'
      }).then(() => {
        if (data.status == 'ok') {
          this.dialogRef.close();
        }
      });
    });
  }
}