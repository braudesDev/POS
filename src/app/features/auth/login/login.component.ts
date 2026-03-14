import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../shared/material/material.module';
import { AuthService } from '../../../core/authentication/auth.service';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MaterialModule,
    MatTabsModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  selectedTabIndex = 0; // 0 = login, 1 = registro

  loading = false;
  loginError = '';
  registerError = '';

  // Para controlar la visibilidad
  hidePassword = true;
  hideRegisterPassword = true;
  hideRegisterConfirm = true;

  // Formulario de login
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  // Formulario de registro
  registerForm = this.fb.group(
    {
      displayName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: this.passwordMatchValidator },
  );

  // Validador personalizado para confirmar contraseña
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onTabChange(index: number) {
    this.selectedTabIndex = index;
    this.loginError = '';
    this.registerError = '';
  }

  async onLogin() {
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.loginError = '';

    const { email, password } = this.loginForm.value;

    try {
      await this.authService.login(email!, password!);
      this.router.navigate(['/pos']);
    } catch (error: any) {
      this.loginError = error.message;
    } finally {
      this.loading = false;
    }
  }

  async onRegister() {
    if (this.registerForm.invalid) return;

    this.loading = true;
    this.registerError = '';

    const { email, password, displayName } = this.registerForm.value;

    try {
      await this.authService.register(email!, password!, displayName!);
      // Después de registrarse, iniciar sesión automáticamente
      await this.authService.login(email!, password!);
      this.router.navigate(['/pos']);
    } catch (error: any) {
      this.registerError = error.message;
    } finally {
      this.loading = false;
    }
  }

  async forgotPassword() {
    const email =
      this.loginForm.get('email')?.value ||
      this.registerForm.get('email')?.value;

    if (!email) {
      this.showMessage('✉️ Ingresa tu email primero', 'warning');
      return;
    }

    this.loading = true;

    try {
      await this.authService.resetPassword(email);
      this.showMessage('📧 Email enviado. Revisa tu bandeja', 'success');
    } catch (error: any) {
      this.showMessage('❌ ' + error.message, 'error');
    } finally {
      this.loading = false;
    }
  }

  private showMessage(message: string, type: 'success' | 'error' | 'warning') {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: [`${type}-snackbar`],
    });
  }
}
