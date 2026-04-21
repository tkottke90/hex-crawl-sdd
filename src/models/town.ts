import type { HexCoord } from './hex';
import type { Character } from './character';

export interface HireableHero {
  characterTemplate: Omit<Character, 'id' | 'recruitmentSource' | 'actedThisPhase' | 'deathRecord'>;
  hireCost: number;
}

export interface Town {
  id: string;
  name: string;
  coord: HexCoord;
  hirePool: HireableHero[];
}
