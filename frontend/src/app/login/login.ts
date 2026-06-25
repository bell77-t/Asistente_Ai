import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  message = '';
  passwordVisible = false;

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
    this.cdr.detectChanges();
  }

  async submit() {
    if (this.form.invalid) {
      this.message = 'Revisa el correo y la clave.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.message = '';
    this.cdr.detectChanges();

    try {
      await this.authService.login(this.form.controls.email.value, this.form.controls.password.value);
      await this.router.navigateByUrl('/dashboard');
    } catch (error) {
      this.loading = false;
      const errorMessage = error instanceof Error ? error.message : '';
      this.message = errorMessage === 'EMAIL_NOT_VERIFIED'
        ? 'Debes verificar tu correo. Te enviamos otro enlace de verificacion.'
        : this.authService.isFirebaseConfigured
        ? 'No se pudo iniciar sesion. Revisa correo y clave.'
        : 'Falta configurar Firebase web en enviroments.ts para activar el login real.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = false;
    this.cdr.detectChanges();
  }
}
