import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  User,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { environment } from '../../enviroments/enviroments';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly app = initializeApp(environment.firebase);
  private readonly auth = getAuth(this.app);
  private readyPromise: Promise<User | null>;
  currentUser: User | null = null;

  constructor() {
    this.readyPromise = new Promise((resolve) => {
      onAuthStateChanged(this.auth, (user) => {
        this.currentUser = user;
        resolve(user);
      });
    });
  }

  get currentUserId() {
    return this.currentUser?.uid || '';
  }

  get isFirebaseConfigured() {
    return Boolean(environment.firebase.apiKey && !environment.firebase.apiKey.startsWith('TU_'));
  }

  async waitForAuth() {
    return this.readyPromise;
  }

  async login(email: string, password: string) {
    if (!email || !password) {
      return Promise.reject(new Error('Email and password are required'));
    }

    this.ensureConfigured();
    const credential = await signInWithEmailAndPassword(this.auth, email, password);
    this.currentUser = credential.user;
    return credential.user;
  }

  async register(email: string, password: string) {
    if (!email || !password) {
      return Promise.reject(new Error('Email and password are required'));
    }

    this.ensureConfigured();
    const credential = await createUserWithEmailAndPassword(this.auth, email, password);
    this.currentUser = credential.user;
    return credential.user;
  }

  logout() {
    return signOut(this.auth);
  }

  private ensureConfigured() {
    if (!this.isFirebaseConfigured) {
      throw new Error('Firebase web config is missing');
    }
  }
}
