import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { Register } from './register/register';
import { Asistente } from './asistente/asistente';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'register',
    component: Register
  },
  {
    path: 'dashboard',
    component: Dashboard
  },
  {
    path: 'asistente',
    component: Asistente
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
