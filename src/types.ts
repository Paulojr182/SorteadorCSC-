export interface Student {
  id: string;
  registration: string;
  name: string;
}

export interface RaffleSettings {
  winnerCount: number;
  allowRepeat: boolean;
  animationSpeed: 'slow' | 'medium' | 'fast';
  animationDuration: number; // in seconds
  autoDraw: boolean;
}

export interface RaffleHistory {
  id: string;
  timestamp: number;
  winners: Student[];
  settings: RaffleSettings;
}

export interface AppState {
  students: Student[];
  settings: RaffleSettings;
  history: RaffleHistory[];
}
