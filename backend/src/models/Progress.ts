export interface GameProgress {
  id: string;
  userId: string;
  gameId: string;
  score: number;
  level: number;
  data: Record<string, unknown>; // Game-specific data
  updatedAt: Date;
}

export interface SaveProgressRequest {
  userId: string;
  gameId: string;
  score: number;
  level: number;
  data?: Record<string, unknown>;
}
