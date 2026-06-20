import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export interface TaskRecord {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt?: unknown;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: unknown;
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
  private readonly baseUrl = 'http://localhost:3000';

  getDashboardStats() {
    return this.http.get<DashboardStats>(`${this.baseUrl}/dashboard`);
  }

  getHardwareStatus() {
    return this.http.get<HardwareStatus>(`${this.baseUrl}/hardware`);
  }

  getRecommendations() {
    return this.http.get<Recommendation[]>(`${this.baseUrl}/recommendations`);
  }

  getTrends() {
    return this.http.get<Trend[]>(`${this.baseUrl}/trends`);
  }

  getTips() {
    return this.http.get<string[]>(`${this.baseUrl}/tips`);
  }

  getTasks() {
    return this.http.get<TaskRecord[]>(`${this.baseUrl}/tasks`);
  }

  createTask(payload: Pick<TaskRecord, 'title' | 'description'>) {
    return this.http.post<{ id: string }>(`${this.baseUrl}/tasks`, payload);
  }

  updateTask(id: string, changes: Partial<Pick<TaskRecord, 'title' | 'description' | 'completed'>>) {
    return this.http.patch<{ ok: true }>(`${this.baseUrl}/tasks/${id}`, changes);
  }

  deleteTask(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/tasks/${id}`);
  }

  saveProfile(payload: Omit<UserProfile, 'id' | 'createdAt'>) {
    return this.http.post<{ id: string }>(`${this.baseUrl}/profiles`, payload);
  }

  getProfile() {
    return this.http.get<UserProfile>(`${this.baseUrl}/profile`);
  }

  updateProfile(payload: Omit<UserProfile, 'id' | 'createdAt' | 'rank'> & { rank?: string }) {
    return this.http.put<UserProfile>(`${this.baseUrl}/profile`, payload);
  }

  getProfiles() {
    return this.http.get<UserProfile[]>(`${this.baseUrl}/profiles`);
  }

  createSession(email: string) {
    return this.http.post<{ id: string }>(`${this.baseUrl}/sessions`, { email });
  }

  getMessages() {
    return this.http.get<ChatMessage[]>(`${this.baseUrl}/messages`);
  }

  createMessage(content: string) {
    return this.http.post<{ userMessageId: string; assistantMessageId: string; response: string }>(
      `${this.baseUrl}/messages`,
      { content },
    );
  }

  clearMessages() {
    return this.http.delete<void>(`${this.baseUrl}/messages`);
  }
}
