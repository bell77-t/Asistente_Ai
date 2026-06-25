import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Dashboard } from './dashboard';
import { ApiService } from '../services/api';
import { AuthService } from '../services/auth';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    const profile = {
      id: 'profile-1',
      callsign: 'Usuario',
      email: 'usuario@test.com',
      level: 'principiante',
      genres: [],
      platform: 'PC',
    };
    const apiMock = {
      getDashboardStats: () => of({
        tasksTotal: 0,
        completedTasks: 0,
        pendingTasks: 0,
        messagesTotal: 0,
        profilesTotal: 1,
        syncStatus: 'OK',
        profile,
      }),
      getTasks: () => of([]),
      createTask: () => of({ id: 'task-1' }),
      updateTask: () => of({ ok: true }),
      deleteTask: () => of(undefined),
    };
    const authMock = {
      logout: () => Promise.resolve(),
    };

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: apiMock },
        { provide: AuthService, useValue: authMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
