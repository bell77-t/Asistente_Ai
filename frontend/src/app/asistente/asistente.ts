import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, ChatMessage, UserProfile } from '../services/api';

@Component({
  selector: 'app-asistente',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './asistente.html',
  styleUrl: './asistente.css',
})
export class Asistente implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  messages: ChatMessage[] = [];
  profile: UserProfile | null = null;
  loading = false;
  status = '';
  confirmClearOpen = false;

  form = this.fb.nonNullable.group({
    content: ['', Validators.required],
  });

  ngOnInit() {
    this.loadMessages();
    this.loadProfile();
  }

  loadProfile() {
    this.api.getProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.cdr.detectChanges();
      },
    });
  }

  loadMessages() {
    this.api.getMessages().subscribe({
      next: (messages) => {
        this.messages = messages;
        this.cdr.detectChanges();
      },
      error: () => {
        this.status = 'No pude cargar mensajes. Verifica el backend.';
        this.cdr.detectChanges();
      },
    });
  }

  sendMessage() {
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    this.status = '';

    this.api.createMessage(this.form.controls.content.value).subscribe({
      next: () => {
        this.form.reset({ content: '' });
        this.loading = false;
        this.loadMessages();
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.status = 'No se pudo guardar el mensaje.';
        this.cdr.detectChanges();
      },
    });
  }

  requestClearMessages() {
    this.confirmClearOpen = true;
    this.cdr.detectChanges();
  }

  cancelClearMessages() {
    this.confirmClearOpen = false;
    this.cdr.detectChanges();
  }

  clearMessages() {
    this.confirmClearOpen = false;
    this.api.clearMessages().subscribe({
      next: () => {
        this.messages = [];
        this.status = 'Historial limpiado en Firestore.';
        this.cdr.detectChanges();
      },
      error: () => {
        this.status = 'No se pudo limpiar el historial.';
        this.cdr.detectChanges();
      },
    });
  }
}
