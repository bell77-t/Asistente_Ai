import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, DashboardStats, HardwareStatus, Recommendation, Trend, UserProfile } from '../services/api';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly api = inject(ApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  stats: DashboardStats | null = null;
  hardware: HardwareStatus | null = null;
  recommendations: Recommendation[] = [];
  trends: Trend[] = [];
  tips: string[] = [];
  profile: UserProfile | null = null;
  loading = false;
  message = '';

  ngOnInit() {
    this.refreshDashboard();
  }

  refreshDashboard() {
    this.loadStats();
    this.loadHardware();
    this.loadRecommendations();
    this.loadTrends();
    this.loadTips();
  }

  loadStats() {
    this.loading = true;
    this.api.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.profile = stats.profile;
        this.recommendations = stats.recommendations;
        this.trends = stats.trends;
        this.tips = stats.tips;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.message = 'No pude cargar el dashboard. Revisa el backend.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadHardware() {
    this.api.getHardwareStatus().subscribe({
      next: (hardware) => {
        this.hardware = hardware;
        this.cdr.detectChanges();
      },
    });
  }

  loadRecommendations() {
    this.api.getRecommendations().subscribe({
      next: (recommendations) => {
        this.recommendations = recommendations;
        this.cdr.detectChanges();
      },
    });
  }

  loadTrends() {
    this.api.getTrends().subscribe({
      next: (trends) => {
        this.trends = trends;
        this.cdr.detectChanges();
      },
    });
  }

  loadTips() {
    this.api.getTips().subscribe({
      next: (tips) => {
        this.tips = tips;
        this.cdr.detectChanges();
      },
    });
  }
}
