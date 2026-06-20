import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth';
import { ApiService } from '../services/api';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  message = '';

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

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
    } catch {
      this.api.createSession(this.form.controls.email.value).subscribe({
        next: async () => {
          this.message = 'Sesion visual guardada. Completa Firebase Auth para login real.';
          this.loading = false;
          this.cdr.detectChanges();
          await this.router.navigateByUrl('/dashboard');
        },
        error: () => {
          this.loading = false;
          this.message = 'No se pudo autenticar ni guardar la sesion. Enciende el backend.';
          this.cdr.detectChanges();
        },
      });
      return;
    }

    this.loading = false;
    this.cdr.detectChanges();
  }
}
