export interface Species {
  id: number;
  name: string;
  scientificName?: string;
  description?: string;
}

export interface Team {
  id: number;
  name: string;
  totalScore?: number;
}

export interface FishCatch {
  id: number;
  species: Species;
  length: number;
  photoUrl: string;
  team: Team;
  isValidated: boolean;
  createdAt: string;
}

export interface ScheduledPause {
  id: number;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface Perimeter {
  id: number;
  name?: string;
  coordinates: number[][]; // [[lat, lng], [lat, lng], ...]
}

export interface Competition {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  type?: string;
  description?: string;
  teamSize?: number;
  maxParticipants?: number;
  hasNoLimit?: boolean;
  isRankingPublic?: boolean;
  isPaused?: boolean;
  isBonusEnabled?: boolean;
  isRegistered?: boolean;
  isEnded?: boolean;
  teams?: Team[];
  scheduledPauses?: ScheduledPause[];
  perimeters?: Perimeter[];
}
