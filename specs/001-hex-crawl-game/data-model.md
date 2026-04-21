# Data Model: Hex Crawl Game — Core Experience

**Branch**: `001-hex-crawl-game` | **Date**: 2026-04-21

---

## Core Types Reference

All types use TypeScript strict notation. Zod schemas mirror these types and are the source of truth for runtime validation (save import, save export verification).

---

## 1. Attribute Block

```typescript
interface Attributes {
  str: number;  // Strength
  dex: number;  // Dexterity
  con: number;  // Constitution
  int: number;  // Intelligence
  wis: number;  // Wisdom
  cha: number;  // Charisma
}
```

**Derived values** (computed, not stored):
- `attackModifier = Math.floor((str - 10) / 2)` (STR for melee; DEX for ranged)
- `defenseValue = 10 + Math.floor((dex - 10) / 2)` (base AC equivalent)
- `maxHp` is class-derived (`maxHpBase + maxHpGrowth * level`) + CON modifier per level

---

## 2. Class & Promotion

```typescript
type ClassTier = 'base' | 'promoted';

interface ClassDefinition {
  id: string;                    // e.g. "squire", "knight", "ranger"
  name: string;
  tier: ClassTier;
  baseStats: Attributes;
  growthRates: Attributes;       // % chance each stat increases per level-up (Fire Emblem style)
  maxHpBase: number;
  maxHpGrowth: number;           // % per level
  promotionLevel: number | null; // null = already promoted or no promotion
  promotionPaths: string[];      // ClassDefinition ids; empty if tier === 'promoted'
  moveRange: number;             // hex tiles per phase
}
```

**State transitions**:
```
base class (level 1–10) ──[level promotionLevel, player chooses]──► promoted class (level 1–20)
```

**Validation rules**:
- `tier === 'base'` classes MUST have `promotionPaths.length >= 2`
- `tier === 'promoted'` classes MUST have `promotionPaths === []`

---

## 3. Character

```typescript
type CharacterRole = 'pc' | 'escort' | 'adventurer';
// pc        — the player's hero; PC death always ends the run
// escort    — the person being protected; Escort death = mission failed, run ends
// adventurer — recruited companions; their deaths are permanent but do NOT end the run

type RecruitmentSource = 'starting' | 'hired' | 'encountered';
// starting  — PC and Escort are always present from run start
// hired     — recruited at a town
// encountered — recruited via rare combat event

type CharacterStatus = 'active' | 'dead';
// Casual mode: player may reload a prior save when PC or Escort dies (no auto-recovery)
// Roguelike mode: PC or Escort death permanently invalidates the save
// Adventurer death: permanent in both modes

interface DeathRecord {
  coord: HexCoord;              // where they fell
  turn: number;                 // global turn counter at time of death
}

interface Character {
  id: string;                   // uuid
  name: string;
  role: CharacterRole;          // pc | escort | adventurer
  classId: string;              // ref ClassDefinition.id
  level: number;                // 1–20
  xp: number;                   // current XP within current level
  xpToNextLevel: number;        // threshold for next level-up
  hp: number;                   // current HP
  maxHp: number;                // derived from class + CON + level
  attributes: Attributes;
  portrait: string;             // asset key
  recruitmentSource: RecruitmentSource;
  status: CharacterStatus;
  statusEffects: StatusEffect[];
  actedThisPhase: boolean;      // exhausted flag; reset each Player Phase start
}
```

**State transitions**:
```
active ──[hp reaches 0, Casual mode]──► incapacitated
active ──[hp reaches 0, Roguelike mode]──► dead (removed from roster)
incapacitated ──[recovery after combat, Casual]──► active (hp = 1)
```

---

## 4. Status Effect

```typescript
interface StatusEffect {
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
```

---

## 5. Hex Coordinate & Tile

```typescript
// Canonical representation — cube coordinates (R-003)
// Invariant: q + r + s === 0 (enforced at construction)
interface HexCoord {
  q: number;
  r: number;
  s: number;  // always -q - r; stored explicitly for clarity and assertion
}

type TerrainType = 'ocean' | 'beach' | 'grassland' | 'forest' | 'desert' | 'mountain' | 'snow';
type PoiTag = 'empty' | 'town' | 'enemy-camp' | 'recruitment-event' | 'dungeon-entrance';

interface HexTile {
  coord: HexCoord;
  terrain: TerrainType;
  passable: boolean;
  moveCost: number;          // movement points required to enter
  poiTag: PoiTag;
  occupants: string[];       // Character id[]
  fogOfWar: boolean;         // true = hidden from player
  explored: boolean;
}
```

**Validation rules**:
- Terrain `ocean` is always `passable: false`
- Terrain `mountain` has `moveCost: 3` by default
- `occupants.length <= 8` (max party size is also max stacking limit per tile, enforced at move resolution)

---

## 6. World Map

```typescript
interface WorldMap {
  seed: string;               // PRNG seed used to generate this map
  width: number;              // columns (q axis)
  height: number;             // rows (r axis)
  tiles: Record<string, HexTile>;  // key = `${q},${r},${s}`
  towns: TownId[];
  enemyCamps: EnemyCampId[];
  playerStartCoord: HexCoord;
}
```

---

## 7. Town

```typescript
interface Town {
  id: string;
  name: string;
  coord: HexCoord;
  hirePool: HireableHero[];   // resets on rest/visit; can be empty
}

interface HireableHero {
  characterTemplate: Omit<Character, 'id' | 'recruitmentSource' | 'actedThisPhase'>;
  hireCost: number;           // gold or equivalent resource
}
```

---

## 8. Enemy Camp & Enemy Unit

```typescript
interface EnemyCamp {
  id: string;
  coord: HexCoord;
  enemies: EnemyUnit[];
  defeated: boolean;
}

interface EnemyUnit {
  id: string;
  name: string;
  classId: string;
  level: number;
  hp: number;
  maxHp: number;
  attributes: Attributes;
  portrait: string;
  statusEffects: StatusEffect[];
}
```

---

## 9. Combat Encounter

```typescript
type CombatPhase = 'player' | 'enemy' | 'resolution';

interface CombatEncounter {
  id: string;
  phase: CombatPhase;
  round: number;
  playerUnits: string[];      // Character id[] (ordered by player arrangement)
  enemyUnits: string[];       // EnemyUnit id[]
  friendlyNpcs: string[];     // EnemyUnit id[] acting autonomously (recruitment events)
  combatLog: CombatLogEntry[];
  resolution: CombatResolution | null;
}

interface CombatLogEntry {
  round: number;
  phase: CombatPhase;
  actorId: string;
  action: 'move' | 'attack' | 'wait' | 'use-item';
  roll: DiceRoll | null;
  targetId: string | null;
  hpDelta: number | null;
  narrative: string;          // e.g. "Aldric rolls 2d6+3 → [4,5]+3 = 12 damage"
}

interface CombatResolution {
  outcome: 'player-victory' | 'player-defeat' | 'retreat';
  survivingFriendlyNpcIds: string[];
  recruitmentOffered: boolean;
}
```

---

## 10. Dice Roll

```typescript
type DiceRollType = 'attack' | 'damage' | 'saving-throw' | 'initiative';

interface DiceRoll {
  type: DiceRollType;
  notation: string;            // e.g. "2d6+3"
  dice: number[];              // individual die results e.g. [4, 5]
  modifier: number;            // e.g. 3
  total: number;               // sum(dice) + modifier
  isCritical: boolean;         // nat 20 equivalent (max single die == die faces)
  isFumble: boolean;           // nat 1 equivalent (single die == 1)
}
```

---

## 11. Recruitment Event

```typescript
type RecruitmentEventStatus = 'pending' | 'accepted' | 'declined' | 'failed-npc-died' | 'failed-party-full';

interface RecruitmentEvent {
  id: string;
  triggerCoord: HexCoord;
  npcCharacterId: string;       // EnemyUnit id acting as friendly NPC
  encounterRef: string;         // CombatEncounter id
  status: RecruitmentEventStatus;
}
```

---

## 12. Game Mode

```typescript
type GameModeType = 'casual' | 'roguelike';

interface GameMode {
  type: GameModeType;
  // Death consequences:
  //   casual    — PC/Escort death prompts player to reload a prior save (no auto-recovery)
  //               Adventurer deaths are always permanent regardless of reloads
  //   roguelike — PC or Escort death permanently invalidates the save (unplayable)
  //               All Adventurer deaths are permanent and recorded
  allowManualSave: boolean;     // true = casual, false = roguelike
  autoSaveOnCheckpoint: boolean; // roguelike: saves on phase transition + tile movement
}
```

---

## 13. Save State (top-level persisted document)

```typescript
interface SaveState {
  version: number;              // migration version (R-008)
  gameMode: GameMode;
  worldMap: WorldMap;
  party: Character[];           // 2–8 characters; always includes exactly one 'pc' and one 'escort'
  deathHistory: DeathRecord[];  // permanent log of fallen Adventurers; survives Casual save reloads
  invalidated: boolean;         // Roguelike: true after PC or Escort death — save is unplayable
  towns: Town[];
  enemyCamps: EnemyCamp[];
  activeCombat: CombatEncounter | null;
  currentLocation: HexCoord;
  gold: number;
  timestamp: string;            // ISO 8601
  metaProgression: MetaProgressionModule;
}
```

---

## 14. MetaProgressionModule (v1 stub)

```typescript
// v1: empty record — no meta-progression exists yet.
// This interface is the extension point (Constitution Principle IV)
// that future versions will populate with run outcomes, unlocks, etc.
interface MetaProgressionModule {
  schemaVersion: 1;
  // future: unlockedClasses, loreEntries, completedRuns, etc.
}
```

---

## Entity Relationship Summary

```
SaveState
├── GameMode
├── WorldMap ──► HexTile[]
├── Character[] (party, 2–8; roles: pc × 1, escort × 1, adventurers × 0–6)
│   ├── ClassDefinition (ref by classId)
│   ├── StatusEffect[]
│   └── DeathRecord | null
├── deathHistory: DeathRecord[]  (permanent log — survives Casual reloads)
├── invalidated: boolean          (Roguelike run-end flag)
├── Town[] ──► HireableHero[]
├── EnemyCamp[] ──► EnemyUnit[]
├── CombatEncounter (nullable)
│   ├── DiceRoll (per action)
│   └── CombatLogEntry[]
├── RecruitmentEvent[]
└── MetaProgressionModule (stub)
```
