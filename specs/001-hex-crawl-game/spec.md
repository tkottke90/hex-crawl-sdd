# Feature Specification: Hex Crawl Game — Core Experience

**Feature Branch**: `001-hex-crawl-game`  
**Created**: 2026-04-21  
**Status**: Draft  
**Input**: User description: "Local-first browser-based hex crawl game using PhaserJS with tactical combat, individual character progression, class evolution, D&D-style diced combat, transparent stat blocks, classic fantasy tone (Lord of the Rings aesthetic, sense of journey), local save to browser or device, casual and roguelike modes."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Start a New Game & Enter the World (Priority: P1)

A player opens the game in their browser for the first time. They choose Casual or Roguelike mode, and begin with a starting party of 2 characters each with a visible stat block. The party is placed on a hex map and the player can immediately move characters across adjacent hex tiles, feeling the sense of setting out on a journey.

**Why this priority**: Without a playable game loop on the hex map, nothing else can be demonstrated or tested. This is the minimum viable slice of the experience.

**Independent Test**: Launch the game in a browser, select a mode, and confirm the player character appears on a hex map and can move to an adjacent tile. No combat, saves, or progression needed.

**Acceptance Scenarios**:

1. **Given** the game is loaded in a browser, **When** the player selects "New Game" and chooses a mode, **Then** a hex map is rendered with the player's character placed on a starting tile.
2. **Given** the player is on the hex map, **When** they select an adjacent passable tile, **Then** the character moves to that tile and the map updates.
3. **Given** the player views their character, **When** they open the stat block panel, **Then** all base stats (name, class, HP, STR, DEX, INT, etc.) are legible and accurate.

---

### User Story 2 — Tactical Combat Encounter (Priority: P2)

The player encounters an enemy on the hex map. Both sides take turns on a tactical hex grid. Dice rolls are visible and annotated (attack roll, damage roll, modifiers). The combat resolves with a winner; the player's character takes damage or is defeated according to mode rules.

**Why this priority**: Combat is the core interaction loop. Without it, the tactical and RPG systems have no context.

**Independent Test**: Trigger a scripted enemy encounter and complete a full combat sequence. Verify dice rolls are shown, turn order is enforced, and HP updates correctly.

**Acceptance Scenarios**:

1. **Given** the player's character enters a tile occupied by an enemy, **When** combat begins, **Then** both units are placed on a tactical hex grid in their respective positions.
2. **Given** it is the player's turn, **When** they select an attack action, **Then** dice roll results (individual dice + modifiers + total) are displayed before damage is applied.
3. **Given** the player's character reaches 0 HP in Casual mode, **When** combat ends, **Then** the character is incapacitated but not permanently lost, and can be recovered.
4. **Given** the player's character reaches 0 HP in Roguelike mode, **When** combat ends, **Then** the run ends permanently and the player returns to the main menu.

---

### User Story 3 — Character Progression & Class Evolution (Priority: P3)

After earning enough experience from encounters, a character levels up. The player sees updated stats and, at defined level thresholds, chooses a class evolution path (e.g., Squire → Knight or Ranger). The progression is visible in the stat block at all times.

**Why this priority**: Progression is the medium-term motivation loop. It builds on combat (US2) and gives runs long-term value.

**Independent Test**: Simulate an XP award sufficient to trigger a level-up, verify stat changes, and at the class-evolution threshold offer the player a choice of class path.

**Acceptance Scenarios**:

1. **Given** a character earns enough XP to level up, **When** the level-up event fires, **Then** stats increase per the class's growth rates and the new level is shown.
2. **Given** a character reaches a class-evolution threshold level, **When** the level-up occurs, **Then** the player is presented with at least two promotion options.
3. **Given** the player selects a promotion class, **When** confirmed, **Then** the character's portrait, class name, and base stat bonuses update to reflect the new class.

---

### User Story 4 — Save & Resume Game (Priority: P4)

The player can save their current game state at any time outside of combat. In Casual mode saves persist across sessions. In Roguelike mode auto-save is used (no manual save scumming). The player can save to the browser (IndexedDB) or export a save file to their device.

**Why this priority**: Save/resume is required for the casual mode to be meaningful as an extended experience, and ensures no progress is lost to accidental browser closure.

**Independent Test**: Save the game, close the browser tab, reopen the game, and load the save — verify map position, character stats, and mode are fully restored.

**Acceptance Scenarios**:

1. **Given** the player is on the world map in Casual mode, **When** they trigger "Save Game", **Then** a save slot is written to browser storage and a confirmation is shown.
2. **Given** a save exists in browser storage, **When** the player selects "Load Game" at the main menu, **Then** the game resumes from the exact saved state.
3. **Given** the player chooses "Export Save File", **When** they confirm, **Then** a `.json` (or equivalent) save file is downloaded to their device.
4. **Given** the player has a save file on their device, **When** they choose "Import Save File" and select the file, **Then** the game loads the state from that file.
5. **Given** the player is in Roguelike mode, **When** they close/reopen the game mid-run, **Then** the run resumes from the last auto-save checkpoint.

---

### User Story 5 — Casual vs. Roguelike Mode Distinction (Priority: P5)

The two modes offer meaningfully different experiences: Casual allows save-anywhere, character revival, and persistent progression between campaigns; Roguelike uses permadeath (run ends when last character falls), run-scoped progression with a starting party of 2 that can grow to 8, and unlockables that carry over between runs. The mode is clearly labeled throughout the UI.

**Why this priority**: Mode differentiation is the structural feature that gives the game two distinct audiences. It layers on top of all previous stories.

**Independent Test**: Start one run in each mode, trigger a character death, and verify the outcome differs (recovery vs. permadeath) and mode label is visible on HUD.

**Acceptance Scenarios**:

1. **Given** the player selects Casual mode, **When** any character is defeated, **Then** a recovery mechanic is available and the run continues.
2. **Given** the player selects Roguelike mode, **When** any character is permanently lost, **Then** that character is removed and the run ends if the last character falls.
3. **Given** the player is in any game screen, **When** they view the HUD, **Then** the active mode (Casual / Roguelike) is always visible.

---

### Edge Cases

- What happens when a player tries to load a save file from an incompatible game version?
- What happens if browser storage quota is exceeded during a save operation?
- What happens when a hex tile has multiple stacked units?
- What happens if the player closes the browser exactly during a save write?
- What happens when a character's stat rolls produce an edge result (natural 1 / natural 20 equivalents)?
- What happens if the recruitable NPC dies during the rare-encounter event before the player wins?
- What happens if the player's party is already at the 8-character cap when a rare recruitment encounter triggers?
- What happens if a town has no heroes available for hire (stock depleted)?

---

## Clarifications

### Session 2026-04-21

- Q: Does the player control a single hero or a party of multiple characters? → A: Growing party of 2–8 characters; starts small and expands through game progression.
- Q: How does the party grow / how do new characters join? → A: Two recruitment paths: (1) Level 1 heroes hired from towns; (2) Rare (<10% chance) higher-level characters encountered mid-combat as friendly NPCs in a pre-existing fight — player recruits them by winning the encounter while the NPC survives; NPC is AI-controlled (not player-controlled) during that first combat.
- Q: What is the combat turn order model? → A: Phase-based (Fire Emblem-style) — all player units act during the Player Phase, then all enemy units act during the Enemy Phase; phases alternate until combat resolves.
- Q: What carries over between Roguelike runs (meta-progression)? → A: No meta-progression in v1 — every run is fully fresh. However, the save system and run-lifecycle module MUST be designed as composable extension points (per Constitution Principle IV) so that meta-progression can be layered in a future version without refactoring the core loop.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The game MUST render a fully procedurally generated hex-tile world map in the browser without any server dependency. A new map MUST be generated at the start of every run (both modes).
- **FR-001a**: The procedural generator MUST place towns, enemy encounters, terrain types, and points of interest across the map using seeded randomness so a given seed produces a reproducible map.
- **FR-002**: The game MUST support exactly two game modes: Casual and Roguelike, selectable at new-game creation.
- **FR-003**: Player characters MUST have fully visible stat blocks (HP, class, level, core attributes, XP) accessible at any time outside combat.
- **FR-004**: Combat MUST be turn-based on a tactical hex grid using a phase-based model: all player units act during the **Player Phase**, then all enemy units act during the **Enemy Phase**; phases alternate until combat resolves.
- **FR-004a**: During the Player Phase, each player unit MAY move and perform one action (attack, wait, use item). Once a unit has acted it is marked exhausted and cannot act again that phase.
- **FR-004b**: During the Enemy Phase, enemy units act via AI in sequence; the player observes but cannot issue commands.
- **FR-005**: Each dice roll MUST show individual die results, applicable modifiers, and the final total.
- **FR-006**: Characters MUST gain XP from combat outcomes and level up when thresholds are met.
- **FR-007**: The game MUST provide at least two class-evolution paths at defined promotion thresholds.
- **FR-008**: In Casual mode, the game MUST allow manual save-to-browser-storage at any time outside of combat.
- **FR-009**: In Roguelike mode, the game MUST auto-save on each phase transition (end of Enemy Phase) and on world-map tile movement. Manual save-loading mid-run is NOT permitted.
- **FR-010**: The game MUST support exporting a save file as a downloadable file to the player's device.
- **FR-011**: The game MUST support importing a save file from the player's device.
- **FR-012**: The player party MUST start with a minimum of 2 characters and MAY grow to a maximum of 8 characters through in-game progression.
- **FR-012a**: Towns MUST offer level 1 heroes available for hire to expand the party.
- **FR-012b**: A rare combat event (trigger probability < 10%) MUST exist in which the party stumbles upon an in-progress fight containing a higher-level friendly NPC. The NPC is AI-controlled during that encounter. If the player wins and the NPC survives, they offer to join the party.
- **FR-012c**: During a recruitment combat event the friendly NPC MUST NOT be player-controlled; the player MUST NOT be able to issue commands to them.
- **FR-013**: In Casual mode, defeated characters MUST be recoverable (not permanently lost).
- **FR-014**: In Roguelike mode, defeated characters MUST be permanently removed (permadeath); the run ends when the last character falls.
- **FR-015**: The active game mode MUST be persistently displayed in the HUD throughout gameplay.
- **FR-016**: The game's visual tone MUST be consistent with classic high fantasy (medieval, pre-industrial, nature-focused). Audio is a stretch goal and not required for the core game loop.

### Key Entities

- **Character**: Name, class, level, XP, HP (current/max), core attributes (STR, DEX, CON, INT, WIS, CHA), equipment slots, portrait, status effects, recruitment source (hired / encountered). The player roster grows from 2 to up to 8 characters via town hiring or rare encounter-based recruitment.
- **RecruitmentEvent**: Trigger type (town-hire / rare-encounter), NPC unit reference, encounter outcome, recruitment offer state (pending / accepted / declined / failed-npc-died).
- **Class**: Name, tier, growth rates, promotion thresholds, available promotion paths, base stats.
- **HexTile**: Grid coordinates, terrain type, passability, movement cost, occupant(s), visual layer, point-of-interest tag (town / enemy-camp / recruitment-event / empty).
- **WorldMap**: Seed value, dimensions, hex tile collection, placed towns, placed encounter zones, generation parameters.
- **CombatEncounter**: Participating units, current phase (Player / Enemy), acting-unit queue within phase, active round count, combat log, resolution state.
- **DiceRoll**: Roll type (attack/damage/save), dice notation (e.g., 2d6+3), individual die results, modifier breakdown, total.
- **SaveState**: Mode, map state, character roster, current location, timestamp, game version.
- **GameMode**: Type (Casual / Roguelike), death handling rule, save permission rules.
- **MetaProgressionModule** *(v1 stub — no active data)*: Interface placeholder satisfying Constitution Principle IV. In v1 it persists an empty record. Future versions populate it with run outcomes, unlocks, and carry-over options without changing the core save contract.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new player can go from launching the game to their first combat action in under 3 minutes.
- **SC-002**: All dice roll results are visible within 500 ms of an action being confirmed.
- **SC-003**: A save operation (to browser storage) completes and is confirmed to the player in under 2 seconds.
- **SC-004**: A successful save-export and save-import round-trip restores 100% of game state without data loss.
- **SC-005**: The game runs at a stable 60 fps on a mid-range device during world-map navigation and combat.
- **SC-006**: Both game modes are playable end-to-end (new game → first combat → character death/survival) without encountering a blocking error.
- **SC-007**: 100% of character stat values and dice roll components are visible to the player at the moment they are relevant — no hidden math.

---

## Assumptions

- A "run" in Roguelike mode is fully scoped: the player starts fresh with a new party (minimum 2 characters) and a procedurally generated map each time. No meta-progression exists in v1. The run-lifecycle and save systems MUST expose a composable `MetaProgressionModule` interface so that carry-over mechanics (lore, cosmetics, unlocks) can be added in a future version without altering the core game loop (Constitution Principle IV).
- The hex world map is fully procedurally generated per run using a seeded PRNG; no fixed geography exists across runs.
- Mobile/touch support is out of scope for v1; the game targets desktop browser with keyboard + mouse.
- Multiplayer is out of scope; the game is single-player only.
- The PhaserJS renderer is the exclusive rendering target; no server-side rendering or native app wrappers are planned for v1.
- Audio (music and SFX) enhances tone but is not required for the game loop to function; audio is a stretch goal within any given feature slice.
- "Local-first" means all game logic and state live in the browser; no account, login, or network requirement exists.
- Save files exported to device use a human-readable, version-tagged JSON format to support future migration tooling.
- The classic fantasy tone is applied to art direction, writing, and UI; specific asset production is outside the scope of this specification.
