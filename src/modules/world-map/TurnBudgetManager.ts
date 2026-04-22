import type { Character } from '../../models/character';

export const MIN_PARTY_MOVE_RANGE = 2;

export function dexModifier(stat: number): number {
  const delta = stat - 10;
  if (delta === 0) return 0;
  return Math.sign(delta) * Math.ceil(Math.abs(delta) / 2);
}

export function computeTurnBudget(partyMembers: Character[]): number {
  const activeBonus = partyMembers
    .filter((character) => character.status === 'active')
    .reduce((sum, character) => sum + dexModifier(character.attributes.dex), 0);

  return Math.max(MIN_PARTY_MOVE_RANGE, 1 + activeBonus);
}

export class TurnBudgetManager {
  private remaining: number;

  constructor(initialBudget = MIN_PARTY_MOVE_RANGE) {
    this.remaining = Math.max(0, Math.floor(initialBudget));
  }

  static fromParty(partyMembers: Character[]): TurnBudgetManager {
    return new TurnBudgetManager(computeTurnBudget(partyMembers));
  }

  resetBudget(partyMembers: Character[]): number {
    this.remaining = computeTurnBudget(partyMembers);
    return this.remaining;
  }

  setRemaining(tiles: number): void {
    this.remaining = Math.max(0, Math.floor(tiles));
  }

  consume(tiles: number): number {
    const spent = Math.max(0, Math.floor(tiles));
    this.remaining = Math.max(0, this.remaining - spent);
    return this.remaining;
  }

  getRemaining(): number {
    return this.remaining;
  }
}