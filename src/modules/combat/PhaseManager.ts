import type { Character } from '../../models/character';
import type { CombatEncounter, CombatPhase } from '../../models/combat';

type SimpleAI = (encounter: CombatEncounter) => Record<string, unknown>;

export class PhaseManager {
  private encounter: CombatEncounter;
  private characters: Character[];
  private round: number;
  private phase: CombatPhase;

  constructor(encounter: CombatEncounter, characters: Character[]) {
    this.encounter = encounter;
    this.characters = characters.map((c) => ({ ...c }));
    this.round = encounter.round;
    this.phase = encounter.phase;
  }

  /** Resets actedThisPhase for all player characters and sets phase to 'player'. Increments round if coming from enemy phase. */
  startPlayerPhase(): Character[] {
    if (this.phase === 'enemy') {
      this.round += 1;
    }
    this.phase = 'player';
    this.characters = this.characters.map((c) => ({
      ...c,
      actedThisPhase: false,
    }));
    return [...this.characters];
  }

  /** Transitions phase to 'enemy'. */
  endPlayerPhase(): void {
    this.phase = 'enemy';
  }

  /** Runs enemy AI, then starts next player phase. */
  runEnemyPhase(ai: SimpleAI): void {
    ai(this.encounter);
    this.startPlayerPhase();
  }

  getPhase(): CombatPhase {
    return this.phase;
  }

  getRound(): number {
    return this.round;
  }

  getCharacters(): Character[] {
    return [...this.characters];
  }
}
