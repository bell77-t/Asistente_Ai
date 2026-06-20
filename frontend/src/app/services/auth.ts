import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  login(email: string, password: string) {
    if (!email || !password) {
      return Promise.reject(new Error('Email and password are required'));
    }

    return Promise.resolve({ email });
  }

  register(email: string, password: string) {
    if (!email || !password) {
      return Promise.reject(new Error('Email and password are required'));
    }

    return Promise.resolve({ email });
  }

  logout() {
    return Promise.resolve();
  }
}
