import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth';

export interface TaskRecord {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt?: unknown;
}

export interface ChatMessage {
  id: string;
  conversationId?: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: unknown;
}

export interface ChatConversation {
  id: string;
  title: string;
  messagesCount: number;
  lastMessage?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserProfile {
  id: string;
  callsign: string;
  email: string;
  rank?: string;
  level: 'principiante' | 'medio' | 'pro';
  genres: string[];
  platform: 'PC' | 'consola' | 'movil';
  createdAt?: unknown;
}

export interface DashboardStats {
  tasksTotal: number;
  completedTasks: number;
  pendingTasks: number;
  messagesTotal: number;
  profilesTotal: number;
  syncStatus: string;
  profile: UserProfile;
  recommendations: Recommendation[];
  trends: Trend[];
  tips: string[];
}

export interface HardwareStatus {
  cpuTemp: number;
  gpuLoad: number;
  memoryLoad: number;
  driver: string;
  updateAvailable: boolean;
  checkedAt: string;
}

export interface Recommendation {
  id: string;
  title: string;
  tag: string;
  note: string;
  imageUrl: string;
}

export interface Trend {
  id: string;
  title: string;
  genre: string;
  signal: string;
  imageUrl: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly baseUrl = 'http://localhost:3000';

  private get requestOptions() {
    const uid = this.auth.currentUserId;

    return uid ? { headers: new HttpHeaders({ 'X-User-Id': uid }) } : {};
  }

  getDashboardStats() {
    return this.http.get<DashboardStats>(`${this.baseUrl}/dashboard`, this.requestOptions);
  }

  getHardwareStatus() {
    return this.http.get<HardwareStatus>(`${this.baseUrl}/hardware`);
  }

  getRecommendations() {
    return this.http.get<Recommendation[]>(`${this.baseUrl}/recommendations`, this.requestOptions);
  }

  getTrends() {
    return this.http.get<Trend[]>(`${this.baseUrl}/trends`);
  }

  getTips() {
    return this.http.get<string[]>(`${this.baseUrl}/tips`, this.requestOptions);
  }

  getTasks() {
    return this.http.get<TaskRecord[]>(`${this.baseUrl}/tasks`, this.requestOptions);
  }

  createTask(payload: Pick<TaskRecord, 'title' | 'description'>) {
    return this.http.post<{ id: string }>(`${this.baseUrl}/tasks`, payload, this.requestOptions);
  }

  updateTask(id: string, changes: Partial<Pick<TaskRecord, 'title' | 'description' | 'completed'>>) {
    return this.http.patch<{ ok: true }>(`${this.baseUrl}/tasks/${id}`, changes, this.requestOptions);
  }

  deleteTask(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/tasks/${id}`, this.requestOptions);
  }

  saveProfile(payload: Omit<UserProfile, 'id' | 'createdAt'>) {
    return this.http.post<{ id: string }>(`${this.baseUrl}/profiles`, payload, this.requestOptions);
  }

  getProfile() {
    return this.http.get<UserProfile>(`${this.baseUrl}/profile`, this.requestOptions);
  }

  updateProfile(payload: Omit<UserProfile, 'id' | 'createdAt' | 'rank'> & { rank?: string }) {
    return this.http.put<UserProfile>(`${this.baseUrl}/profile`, payload, this.requestOptions);
  }

  getProfiles() {
    return this.http.get<UserProfile[]>(`${this.baseUrl}/profiles`, this.requestOptions);
  }

  createSession(email: string) {
    return this.http.post<{ id: string }>(`${this.baseUrl}/sessions`, { email });
  }

  getMessages() {
    return this.http.get<ChatMessage[]>(`${this.baseUrl}/messages`, this.requestOptions);
  }

  createMessage(content: string) {
    return this.http.post<{ userMessageId: string; assistantMessageId: string; response: string }>(
      `${this.baseUrl}/messages`,
      { content },
      this.requestOptions,
    );
  }

  clearMessages() {
    return this.http.delete<void>(`${this.baseUrl}/messages`, this.requestOptions);
  }

  getConversations() {
    return this.http.get<ChatConversation[]>(`${this.baseUrl}/conversations`, this.requestOptions);
  }

  createConversation(title = 'Nuevo chat de tareas') {
    return this.http.post<ChatConversation>(`${this.baseUrl}/conversations`, { title }, this.requestOptions);
  }

  getConversationMessages(conversationId: string) {
    return this.http.get<ChatMessage[]>(`${this.baseUrl}/conversations/${conversationId}/messages`, this.requestOptions);
  }

  createConversationMessage(conversationId: string, content: string) {
    return this.http.post<{ conversationId: string; userMessageId: string; assistantMessageId: string; response: string }>(
      `${this.baseUrl}/conversations/${conversationId}/messages`,
      { content },
      this.requestOptions,
    );
  }

  deleteConversation(conversationId: string) {
    return this.http.delete<void>(`${this.baseUrl}/conversations/${conversationId}`, this.requestOptions);
  }
}
