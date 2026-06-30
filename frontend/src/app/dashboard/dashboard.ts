import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService, DashboardStats, TaskRecord, UserProfile } from '../services/api';
import { AuthService } from '../services/auth';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  stats: DashboardStats | null = null;
  tasks: TaskRecord[] = [];
  profile: UserProfile | null = null;
  editingTaskId = '';
  loading = false;
  message = '';

  todayDate = this.formatDate(new Date());

  // Formulario mejorado con todos los campos extendidos de la tarea
  taskForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    priority: ['media' as 'baja' | 'media' | 'alta', Validators.required],
    category: ['General', Validators.required],
    dueDate: ['', [this.futureOrTodayDateValidator.bind(this)]],
    dueTime: [''],
    status: ['pendiente' as 'pendiente' | 'en_progreso' | 'completada', Validators.required],
    notes: [''],
  });

  private futureOrTodayDateValidator(control: AbstractControl) {
    const value = control.value;
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return { pastDate: true };

    const selected = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return selected < today ? { pastDate: true } : null;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  ngOnInit() {
    this.refreshDashboard();
  }

  refreshDashboard() {
    this.loadStats();
    this.loadTasks();
  }

  loadStats() {
    this.loading = true;
    this.api.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.profile = stats.profile;
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

  loadTasks() {
    this.api.getTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.cdr.detectChanges();
      },
      error: () => {
        this.message = 'No pude cargar las tareas guardadas.';
        this.cdr.detectChanges();
      },
    });
  }

  saveTask() {
    if (this.taskForm.get('dueDate')?.invalid) {
      this.message = 'No se permiten fechas anteriores al día de hoy. Seleccione una fecha válida.';
      this.cdr.detectChanges();
      return;
    }

    if (this.taskForm.invalid) {
      this.message = 'Por favor, rellena los campos obligatorios correctamente.';
      this.cdr.detectChanges();
      return;
    }

    const task = this.taskForm.getRawValue();
    this.loading = true;
    this.message = '';

    const request: Observable<{ id: string } | { ok: true }> = this.editingTaskId
      ? this.api.updateTask(this.editingTaskId, task)
      : this.api.createTask(task);

    request.subscribe({
      next: () => {
        this.resetTaskForm();
        this.loading = false;
        this.loadTasks();
        this.loadStats();
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.message = 'No pude guardar la tarea. Verifica el backend.';
        this.cdr.detectChanges();
      },
    });
  }

  startEditTask(task: TaskRecord) {
    this.editingTaskId = task.id;
    this.taskForm.setValue({
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'media',
      category: task.category || 'General',
      dueDate: task.dueDate || '',
      dueTime: task.dueTime || '',
      status: task.status || (task.completed ? 'completada' : 'pendiente'),
      notes: task.notes || '',
    });
    this.message = '';
    this.cdr.detectChanges();
  }

  cancelEditTask() {
    this.resetTaskForm();
    this.cdr.detectChanges();
  }

  private resetTaskForm() {
    this.editingTaskId = '';
    this.taskForm.reset({
      title: '',
      description: '',
      priority: 'media',
      category: 'General',
      dueDate: '',
      dueTime: '',
      status: 'pendiente',
      notes: '',
    });
  }

  toggleTask(task: TaskRecord) {
    const completed = !(task.status === 'completada' || task.completed);

    this.api.updateTask(task.id, {
      completed,
      status: completed ? 'completada' : 'pendiente',
    }).subscribe({
      next: () => {
        this.loadTasks();
        this.loadStats();
      },
      error: () => {
        this.message = 'No pude actualizar la tarea.';
        this.cdr.detectChanges();
      },
    });
  }

  deleteTask(taskId: string) {
    this.api.deleteTask(taskId).subscribe({
      next: () => {
        this.tasks = this.tasks.filter((task) => task.id !== taskId);
        this.loadStats();
        this.cdr.detectChanges();
      },
      error: () => {
        this.message = 'No pude eliminar la tarea.';
        this.cdr.detectChanges();
      },
    });
  }

  async logout() {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
    this.cdr.detectChanges();
  }
}
