/**
 * API client for backend communication
 */

const API_BASE_URL = (import.meta as { env?: { PROD?: boolean } }).env?.PROD
  ? '/api'
  : 'http://localhost:8080/api';

export interface User {
  id: string;
  username: string;
  avatar: string;
  createdAt: Date;
}

export interface GameProgress {
  id: string;
  userId: string;
  gameId: string;
  score: number;
  level: number;
  data: Record<string, unknown>;
  updatedAt: Date;
}

export interface GuestbookEntry {
  id: string;
  username: string;
  message: string;
  avatar: string;
  createdAt: Date;
}

export const AVATARS = [
  '🦊', '🐼', '🦁', '🐨', '🐸', '🦉',
  '🐙', '🦄', '🐱', '🐶', '🐰', '🦝',
  '🐯', '🐻'
] as const;

class ApiClient {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' })) as { error?: string };
      throw new Error(error.error ?? `HTTP ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  // User endpoints
  async createUser(username: string, avatar: string): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify({ username, avatar }),
    });
  }

  async getUser(id: string): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  async updateAvatar(userId: string, avatar: string): Promise<User> {
    return this.request<User>(`/users/${userId}/avatar`, {
      method: 'PUT',
      body: JSON.stringify({ avatar }),
    });
  }

  // Progress endpoints
  async saveProgress(
    userId: string,
    gameId: string,
    score: number,
    level: number,
    data?: Record<string, unknown>
  ): Promise<GameProgress> {
    return this.request<GameProgress>('/progress', {
      method: 'POST',
      body: JSON.stringify({ userId, gameId, score, level, data }),
    });
  }

  async getProgress(userId: string, gameId: string): Promise<GameProgress> {
    return this.request<GameProgress>(`/progress/${userId}/${gameId}`);
  }

  async getAllProgress(userId: string): Promise<GameProgress[]> {
    return this.request<GameProgress[]>(`/progress/${userId}`);
  }

  // Guestbook endpoints
  async getGuestbookEntries(limit = 50, offset = 0): Promise<GuestbookEntry[]> {
    return this.request<GuestbookEntry[]>(
      `/guestbook?limit=${limit}&offset=${offset}`
    );
  }

  async createGuestbookEntry(
    username: string,
    message: string,
    avatar: string
  ): Promise<GuestbookEntry> {
    return this.request<GuestbookEntry>('/guestbook', {
      method: 'POST',
      body: JSON.stringify({ username, message, avatar }),
    });
  }
}

export const api = new ApiClient();
