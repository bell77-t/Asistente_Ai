import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/api';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  message = '';
  isError = false;
  editing = false;
  hasProfile = false;
  confirmSaveOpen = false;

  form = this.fb.nonNullable.group({
    callsign: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    level: ['principiante', Validators.required],
    platform: ['PC', Validators.required],
    genreFps: [true],
    genreRpg: [true],
    genreMoba: [false],
    genreSports: [false],
    genreStrategy: [false],
  });

  ngOnInit() {
    this.api.getProfile().subscribe({
      next: (profile) => {
        this.hasProfile = true;
        this.form.patchValue({
          callsign: profile.callsign,
          email: profile.email,
          level: profile.level,
          platform: profile.platform,
          genreFps: profile.genres.includes('Trabajo'),
          genreRpg: profile.genres.includes('Estudio'),
          genreMoba: profile.genres.includes('Personal'),
          genreSports: profile.genres.includes('Proyectos'),
          genreStrategy: profile.genres.includes('Hogar'),
        });
        this.cdr.detectChanges();
      },
    });
  }

  toggleEdit() {
    this.editing = !this.editing;
    this.cdr.detectChanges();
  }

  get selectedGenres() {
    const value = this.form.getRawValue();

    return [
      value.genreFps ? 'Trabajo' : '',
      value.genreRpg ? 'Estudio' : '',
      value.genreMoba ? 'Personal' : '',
      value.genreSports ? 'Proyectos' : '',
      value.genreStrategy ? 'Hogar' : '',
    ].filter(Boolean).join(', ') || 'Sin areas';
  }

  requestSave() {
    if (this.form.invalid) {
      this.message = 'Completa todos los campos correctamente.';
      this.isError = true;
      this.cdr.detectChanges();
      return;
    }

    this.confirmSaveOpen = true;
    this.cdr.detectChanges();
  }

  cancelSave() {
    this.confirmSaveOpen = false;
    this.cdr.detectChanges();
  }

  async submit() {
    this.confirmSaveOpen = false;

    if (this.form.invalid) {
      this.message = 'Completa todos los campos correctamente.';
      this.isError = true;
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.message = '';
    this.isError = false;
    this.cdr.detectChanges();
    const value = this.form.getRawValue();
    const genres = this.selectedGenres.split(', ').filter((genre) => genre !== 'Sin areas');

    try {
      await this.auth.register(value.email, value.password);
    } catch {
      this.loading = false;
      this.isError = true;
      this.message = this.auth.isFirebaseConfigured
        ? 'No se pudo crear la cuenta. Revisa el correo o usa otra clave.'
        : 'Falta configurar Firebase web en enviroments.ts para crear usuarios reales.';
      this.cdr.detectChanges();
      return;
    }

    this.api.updateProfile({
      callsign: value.callsign,
      email: value.email,
      level: value.level as 'principiante' | 'medio' | 'pro',
      genres,
      platform: value.platform as 'PC' | 'consola' | 'movil',
    }).subscribe({
      next: async () => {
        if (!this.message) {
          this.message = 'Perfil de tareas actualizado en Firestore.';
        }
        this.loading = false;
        this.editing = false;
        this.hasProfile = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.isError = true;
        this.message = 'No se pudo guardar el perfil. Enciende el backend en el puerto 3000.';
        this.cdr.detectChanges();
      },
    });
  }
}
