import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Asistente } from './asistente';
import { ApiService } from '../services/api';

describe('Asistente', () => {
  let component: Asistente;
  let fixture: ComponentFixture<Asistente>;

  beforeEach(async () => {
    const apiMock = {
      getProfile: () => of({
        id: 'profile-1',
        callsign: 'Usuario',
        email: 'usuario@test.com',
        level: 'principiante',
        genres: [],
        platform: 'PC',
      }),
      getConversations: () => of([]),
      getConversationMessages: () => of([]),
    };

    await TestBed.configureTestingModule({
      imports: [Asistente],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: apiMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Asistente);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
