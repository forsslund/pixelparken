/**
 * Simple user session management using localStorage
 */

import type { User } from './api';

const USER_STORAGE_KEY = 'pixelparken_user';

export class UserStore {
  private currentUser: User | null = null;

  constructor() {
    this.loadUser();
  }

  private loadUser(): void {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
      } catch (e) {
        console.error('Failed to load user from storage', e);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
  }

  setUser(user: User): void {
    this.currentUser = user;
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  getUser(): User | null {
    return this.currentUser;
  }

  clearUser(): void {
    this.currentUser = null;
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  isLoggedIn(): boolean {
    return this.currentUser !== null;
  }
}

export const userStore = new UserStore();
