import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Asistente } from './asistente';

describe('Asistente', () => {
  let component: Asistente;
  let fixture: ComponentFixture<Asistente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Asistente],
    }).compileComponents();

    fixture = TestBed.createComponent(Asistente);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
