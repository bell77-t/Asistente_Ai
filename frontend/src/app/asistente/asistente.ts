import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, ChatConversation, ChatMessage, UserProfile } from '../services/api';

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
  conversations: ChatConversation[] = [];
  selectedConversationId = '';
  profile: UserProfile | null = null;
  loading = false;
  status = '';
  confirmClearOpen = false;
  conversationToDeleteId = '';
  sendingContent = '';

  form = this.fb.nonNullable.group({
    content: ['', Validators.required],
  });

  get selectedConversation() {
    return this.conversations.find((conversation) => conversation.id === this.selectedConversationId) || null;
  }

  ngOnInit() {
    this.loadConversations();
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
    if (!this.selectedConversationId) {
      return;
    }

    this.api.getConversationMessages(this.selectedConversationId).subscribe({
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

  loadConversations() {
    this.api.getConversations().subscribe({
      next: (conversations) => {
        this.conversations = conversations;
        this.selectedConversationId = this.selectedConversationId || conversations[0]?.id || '';
        this.loadMessages();
        this.cdr.detectChanges();
      },
      error: () => {
        this.status = 'No pude cargar el historial de chats.';
        this.cdr.detectChanges();
      },
    });
  }

  selectConversation(conversationId: string) {
    this.selectedConversationId = conversationId;
    this.status = '';
    this.loadMessages();
    this.cdr.detectChanges();
  }

  refreshConversation(conversationId: string, event: MouseEvent) {
    event.stopPropagation();
    this.selectedConversationId = conversationId;
    this.loadMessages();
    this.loadConversations();
    this.cdr.detectChanges();
  }

  createNewChat() {
    this.loading = true;
    this.status = '';
    this.api.createConversation().subscribe({
      next: (conversation) => {
        this.conversations = [conversation, ...this.conversations];
        this.selectedConversationId = conversation.id;
        this.messages = [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.status = 'No pude crear un chat nuevo.';
        this.cdr.detectChanges();
      },
    });
  }

  sendMessage() {
    if (this.form.invalid || this.loading) {
      return;
    }

    const content = this.form.controls.content.value.trim();
    if (!content) {
      return;
    }

    this.loading = true;
    this.status = '';
    this.sendingContent = content;
    this.form.reset({ content: '' });

    const tempUserMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      content,
    };

    const send = (conversationId: string) => {
      this.messages = [...this.messages, { ...tempUserMessage, conversationId }];
      this.cdr.detectChanges();

      this.api.createConversationMessage(conversationId, content).subscribe({
        next: (result) => {
          this.loading = false;
          this.sendingContent = '';
          this.messages = [
            ...this.messages.filter((message) => message.id !== tempUserMessage.id),
            {
              id: result.userMessageId,
              conversationId,
              role: 'user',
              content,
            },
            {
              id: result.assistantMessageId,
              conversationId,
              role: 'assistant',
              content: result.response,
            },
          ];
          this.loadConversations();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.loading = false;
          this.sendingContent = '';
          this.messages = this.messages.filter((message) => message.id !== tempUserMessage.id);
          this.form.patchValue({ content });
          const backendMessage = error?.error?.error || '';
          this.status = isHighDemandError(backendMessage)
            ? 'La IA esta con alta demanda ahora mismo. Intenta otra vez en unos segundos.'
            : backendMessage || 'No se pudo guardar el mensaje. Verifica que el backend este encendido.';
          this.cdr.detectChanges();
        },
      });
    };

    if (this.selectedConversationId) {
      send(this.selectedConversationId);
      return;
    }

    this.api.createConversation(buildLocalTitle(content)).subscribe({
      next: (conversation) => {
        this.conversations = [conversation, ...this.conversations];
        this.selectedConversationId = conversation.id;
        this.messages = [];
        send(conversation.id);
      },
      error: () => {
        this.loading = false;
        this.sendingContent = '';
        this.form.patchValue({ content });
        this.status = 'No pude crear el chat para enviar el mensaje.';
        this.cdr.detectChanges();
      },
    });
  }

  requestClearMessages(conversationId = this.selectedConversationId, event?: MouseEvent) {
    event?.stopPropagation();
    this.conversationToDeleteId = conversationId;
    this.confirmClearOpen = true;
    this.cdr.detectChanges();
  }

  cancelClearMessages() {
    this.confirmClearOpen = false;
    this.conversationToDeleteId = '';
    this.cdr.detectChanges();
  }

  clearMessages() {
    this.confirmClearOpen = false;
    const conversationId = this.conversationToDeleteId || this.selectedConversationId;
    if (!conversationId) {
      return;
    }

    this.api.deleteConversation(conversationId).subscribe({
      next: () => {
        this.messages = [];
        this.conversations = this.conversations.filter((conversation) => conversation.id !== conversationId);
        this.selectedConversationId = this.selectedConversationId === conversationId
          ? this.conversations[0]?.id || ''
          : this.selectedConversationId;
        this.conversationToDeleteId = '';
        this.status = 'Chat eliminado del historial.';
        if (this.selectedConversationId) {
          this.loadMessages();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.status = 'No se pudo eliminar este chat.';
        this.cdr.detectChanges();
      },
    });
  }
}

function buildLocalTitle(content: string) {
  return content.length > 42 ? `${content.slice(0, 42)}...` : content;
}

function isHighDemandError(message: string) {
  const normalized = message.toLowerCase();

  return normalized.includes('high demand') ||
    normalized.includes('try again later') ||
    normalized.includes('overloaded') ||
    normalized.includes('temporarily') ||
    normalized.includes('resource exhausted');
}
