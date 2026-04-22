# Master Specification: Hex Crawl Game

**Status**: Working Draft
**Source**: Consolidated from feature specs `001-hex-crawl-game`, `002-world-map-camera`, and `003-party-movement`.

## Overview

This document is the source of truth for the current game. It describes the playable core loop, the world-map navigation rules, camera behavior, combat, progression, saving, and the party movement model as they exist across the completed feature slices.

The game is a local-first, single-player browser hex crawl with a classic fantasy tone. The player leads a growing party across a procedurally generated world map, enters tactical combat on contact, levels characters over time, and can save or resume progress according to the selected mode.

## Edge Cases

- What happens when a save file is from an incompatible version? The load path should reject it cleanly and surface a clear message.
- What happens when browser storage is full? The save should fail gracefully and notify the player.
- What happens when the party is already at the roster cap and a recruitment event triggers? Recruitment is denied.
- What happens when a legacy save contains characters on different tiles? The save is repaired on load so the party shares a single tile again.
- What happens when a character dies during a run? Non-PC deaths are permanent and recorded; PC or Escort deaths end the run.
- What happens when the camera is already at a map edge? It clamps to the renderable boundary and does not reveal empty space.

## Requirements

### Functional Requirements

- **FR-001**: The game MUST render a fully procedural hex-tile world map in the browser without server dependency. A new map MUST be generated at the start of every run. Unvisited tiles MUST remain hidden by fog-of-war until revealed.
- **FR-001a**: The generator MUST place towns, enemy encounters, terrain types, and points of interest using seeded randomness so a given seed produces the same map.
- **FR-001b**: Every world map tile MUST render terrain-specific pixel artwork so the player can identify terrain type at a glance without a legend. Each terrain type MUST have visually distinct artwork.
- **FR-001c**: World map hexes MUST be rendered at twice the hex radius size so each tile has sufficient visual space for readable terrain artwork.
- **FR-002**: The game MUST support exactly two modes: Casual and Roguelike, selectable at new-game creation.
- **FR-003**: Character stat blocks MUST be fully visible outside combat, including name, role, class, level, XP, HP, and core attributes.
- **FR-004**: Combat MUST be tactical and phase-based on a hex grid. All player units act during the Player Phase, then all enemy units act during the Enemy Phase; phases alternate until combat resolves.
- **FR-004a**: During the Player Phase, each player unit MAY move and perform one action. Once a unit has acted it is exhausted and cannot act again that phase. The player MAY act units in any order. Movement is final once executed; there is no undo in v1.
- **FR-004b**: During the Enemy Phase, enemy units act in sequence via AI and the player cannot issue commands.
- **FR-005**: Dice rolls MUST show individual die results, modifiers, and final totals. Attack rolls use d20 plus the relevant attribute modifier against defense. Damage uses its own dice expression plus the relevant modifier. A natural 20 doubles damage dice but is not an auto-hit. A natural 1 is always a miss and is shown as a Critical Miss placeholder.
- **FR-006**: Characters MUST gain XP from combat outcomes and level up on a universal XP curve. Each class MUST apply its own growth rates on level-up.
- **FR-007**: The game MUST provide at least two class evolution paths at defined promotion thresholds.
- **FR-008**: The party MUST always begin with exactly two characters: the Player Character and the Escort. Additional Adventurers MAY join later and the party MUST cap at eight total members.
- **FR-008a**: Towns MUST offer level 1 heroes for hire. Hiring a hero costs 20 gold and is rejected when the player cannot afford it.
- **FR-008b**: A rare combat recruitment event MUST exist with a trigger probability below 10 percent. The friendly NPC in that event MUST be AI-controlled during the encounter and may join if the player wins and the NPC survives.
- **FR-008c**: The run MUST begin with 20 gold. Gold MUST be earned from kills and camp clears and MUST be stored in save data.
- **FR-009**: World-map movement MUST be unified. Clicking a destination tile MUST move the whole party together along a single path, subject to the remaining turn budget. All party members MUST share the same tile coordinate on the world map after this feature is released.
- **FR-009a**: The movement budget MUST be turn-based and MUST deplete across multiple clicks within the same turn. The budget formula is `Math.max(MIN_PARTY_MOVE_RANGE, 1 + sum(dexModifier(m) for active m in party))`, where `MIN_PARTY_MOVE_RANGE = 2`. The movement dex modifier MUST follow the canonical tuning map used by the current implementation: 10 -> 0, 11-12 -> +1, 13-14 -> +2, 8-9 -> -1, 6-7 -> -2, and so on.
- **FR-009b**: The remaining turn budget MUST be displayed at all times on the world map, and tile highlighting MUST reflect the remaining budget rather than the full budget.
- **FR-009c**: The remaining turn budget MUST refresh at turn-boundary events, including returning from combat, returning from a town panel, and an explicit End Turn action.
- **FR-009d**: If a clicked path exceeds the remaining budget, the party MUST move as far as possible and stop on the last tile within budget. If no path exists or the tile is impassable, the click is ignored silently.
- **FR-009e**: Non-PC characters that die on the world map MUST be removed from the active party roster and replaced with a persistent death marker on the tile where they died. The marker MUST show the character's name and survive save/load cycles.
- **FR-009f**: Legacy saves that contain party members on different tiles MUST be repaired on load by relocating the party to the Player Character's tile before the first player action.
- **FR-010**: The active character MUST be used for stat display and camera focus only. Selection MUST NOT control movement scope.
- **FR-011**: The camera MUST center on the active character when the world map loads, MUST follow the active character with a smooth ease-out tween after movement, MUST allow manual pan with Arrow keys and WASD, MUST expose a fixed re-center button in the bottom-right corner, and MUST clamp to map boundaries. Zoom is out of scope for v1.
- **FR-011a**: The camera MUST not move during enemy or NPC turns and MUST remain on the last player-controlled position until the next player-facing camera event.
- **FR-012**: Manual camera pan MUST scroll independently of party movement, and opposing keys on the same axis MUST cancel each other out.
- **FR-013**: Save and load MUST support browser storage, export, and import. Casual mode MUST allow manual save-to-browser-storage outside combat. Roguelike mode MUST auto-save and MUST not allow manual save loading mid-run.
- **FR-013a**: Save state MUST include the map, roster, current location, gold, death history, remaining turn budget, camera-relevant world state, and version metadata. Older saves that omit the remaining budget MUST restore it from the current party state.
- **FR-013b**: Save files MUST be human-readable, version-tagged JSON.
- **FR-014**: Casual mode MUST allow loading any previously saved state. Roguelike mode MUST invalidate the save permanently when the Player Character or Escort dies.
- **FR-014a**: Adventurer deaths MUST be permanent in both modes and MUST be recorded with hex coordinates and the turn number. Casual reloads MUST not erase that death history.
- **FR-015**: The run MUST end immediately when the Player Character dies or when the Escort dies.
- **FR-015a**: After a combat victory, the game MUST show a Victory Summary screen before returning to the world map. The summary MUST show enemies defeated, XP earned per character, and any deaths from the encounter.
- **FR-016**: The active game mode MUST always be visible in the HUD.
- **FR-017**: The game's visual tone SHOULD remain classic high fantasy with a medieval, journey-focused feel. Audio is a stretch goal and not required for the core loop.
- **FR-018**: The game MUST retain a `MetaProgressionModule` extension point, but v1 MUST persist only an empty record so that future carry-over systems can be added without refactoring the save contract.

### Key Entities

- **Character**: Name, role (PC, Escort, Adventurer), class, level, XP, HP, attributes, defense, equipment slots, portrait, status effects, recruitment source, and death record.
- **Party**: The full set of player-controlled characters. The party shares a single world-map tile.
- **HexTile**: Coordinates, terrain type, passability, movement cost, occupants, point of interest, terrain artwork key, visual state, and fog-of-war state.
- **WorldMap**: Seed, dimensions, hex collection, placed towns, placed encounters, and generation parameters.
- **Camera**: The viewport into the world map. It can follow an active character, pan manually, and clamp to map boundaries.
- **CombatEncounter**: Participating units, phase, acting queue, round count, combat log, and resolution state.
- **DiceRoll**: Roll type, notation, individual results, modifier breakdown, and total.
- **SaveState**: Mode, map state, roster, current location, gold, death history, remaining turn budget, version metadata, and invalidation flag.
- **GameMode**: Casual or Roguelike, including save rules and invalidation behavior.
- **DeathRecord**: The character name, hex coordinate, and turn number for a permanent death entry.
- **MetaProgressionModule**: A v1 placeholder with no active data.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A new player can go from launching the game to the first combat action in under 3 minutes.
- **SC-001a**: On world map load, 100% of visible tiles render terrain-specific artwork. In an automated render analysis of a fixed-seed map, average pixel variance inside visible tile bounds is at least 50% above the flat-fill baseline.
- **SC-002**: The active character's tile is centered in the viewport on the first interactive frame after world-map load.
- **SC-003**: Camera follow tween completes within 400 ms for single-tile moves and within 600 ms for multi-tile moves under normal gameplay conditions.
- **SC-004**: Manual pan input begins within one rendered frame of a key press.
- **SC-005**: Clicking any reachable destination moves 100 percent of party members to the same tile with no character left behind.
- **SC-006**: Dice roll details are visible within 500 ms of action confirmation.
- **SC-007**: A browser save operation completes and is confirmed within 2 seconds.
- **SC-008**: Save export and import round-trips restore 100 percent of game state without data loss.
- **SC-009**: Both game modes are playable end-to-end without a blocking error.
- **SC-010**: All stat values, dice components, and death records are visible to the player when relevant.
- **SC-011**: Death markers from saved runs render on the world map within one render frame of scene readiness.
- **SC-012**: No camera boundary violations occur in automated tests across varied map seeds.

## Assumptions

- The game is single-player only.
- Mobile/touch support is out of scope for v1.
- PhaserJS is the only rendering target.
- No active meta-progression exists in v1, but the save format and run lifecycle must preserve the `MetaProgressionModule` extension point.
- The active character is a camera and stats focus target, not a movement owner.
- The movement budget and save-state behavior in this master spec supersede any older per-feature wording where the feature specs overlap.
