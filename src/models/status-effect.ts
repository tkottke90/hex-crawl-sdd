import type { Attributes } from './attributes';

export interface StatusEffect {
  id: string;
  name: string;
  durationType: 'rounds' | 'permanent';
  remainingRounds: number | null;
  modifiers: Partial<Attributes>;
  statModifiers: {
    moveRange?: number;
    attackBonus?: number;
    defenseBonus?: number;
  };
}
