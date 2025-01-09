export interface Species {
  id: number;
  name: string;
  scientificName?: string;
  description?: string;
}

export interface Team {
  id: number;
  name: string;
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

export interface Competition {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
}
