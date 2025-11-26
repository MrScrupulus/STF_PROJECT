export interface Species {
  id: number;
  name: string;
  coefficient?: number;
  basePoints?: number;
}

export interface Team {
  id: number;
  name: string;
  totalScore?: number;
  hasBonus?: boolean;
}

export interface FishCatch {
  id: number;
  species: Species;
  length: number;
  points: number;
  photoUrl?: string;
  team: Team;
  catchTime: string;
  isValidated: boolean;
}

export interface Competition {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  teams?: Team[];
}

export interface User {
  id: number;
  email: string;
  firstname?: string;
  lastname?: string;
  phoneNumber?: string;
  country?: string;
  subscriberNumber?: string;
}

