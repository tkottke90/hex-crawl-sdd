# Feature Specification: Unified Party Movement

**Feature Branch**: `003-party-movement`
**Created**: 2026-04-21
**Status**: Draft
**Input**: User description: "We need to modify the movement system a little bit. Currently each character has their own movement. Users can select the Hero or Ward at the start. The player should move the whole party at once when looking at the world."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Move Whole Party with One Click (Priority: P1)

When a player taps/clicks a destination tile on the world map, all party members move together to that tile simultaneously. No character needs to be individually selected for movement; a single click moves the whole group.

**Why this priority**: This is the core change requested. The current per-character movement makes the game feel awkward — the ward could be left behind across the map. Unified movement is the primary gameplay improvement and everything else depends on it.

**Independent Test**: Start a new game (party has PC + Ward). Click any reachable passable tile. Both character sprites animate to the destination. Confirm both characters now share the destination tile in the data model.

**Acceptance Scenarios**:

1. **Given** the world map is loaded with a PC and Ward on the start tile, **When** the player clicks a reachable passable tile, **Then** both characters move to the destination tile and their sprites animate there simultaneously.
2. **Given** the party is on a tile, **When** the player clicks an impassable tile (ocean, mountain), **Then** no characters move.
3. **Given** the party is on a tile, **When** the player clicks a tile with no valid path, **Then** no characters move and no error occurs.
4. **Given** combat has added an adventurer to the party, **When** the player clicks a destination tile, **Then** all party members (PC + Ward + adventurer) move to the destination together.

---

### User Story 2 - Select Character for Stat Display and Camera Focus (Priority: P2)

The player can still tap a character sprite to bring up that character's stats in the stat panel and shift camera focus to them. Selecting a character no longer changes which character "owns" movement; it only controls the info panel and camera.

**Why this priority**: Players still need to inspect individual character stats and the camera focus feature from feature 002 must remain functional. This story preserves that capability while decoupling selection from movement.

**Independent Test**: Click the Ward sprite. The stat panel updates to show the Ward's stats. Click the PC sprite. Stats update to show the PC. Then click a destination tile — both characters still move.

**Acceptance Scenarios**:

1. **Given** the stat panel is showing the PC's stats, **When** the player taps the Ward's sprite, **Then** the stat panel updates to display the Ward's stats.
2. **Given** a character is selected, **When** the player clicks a destination tile, **Then** all party members move — not just the selected character.
3. **Given** a character is selected for stats, **When** the party moves, **Then** the camera follows the selected character's destination position.

---

### User Story 3 - Party Stays Together After Save/Restore (Priority: P3)

When a saved game is loaded, all party members are on the same tile and the unified movement behaviour is preserved. No scenario should be possible where characters are on different tiles after save/restore.

**Why this priority**: Data integrity — the save format must reflect the unified model so a save made before this feature can be loaded without characters being stranded on different tiles.

**Independent Test**: Move the party to a tile. Save the game. Reload. Confirm all party members are on the same tile. Click a new destination — all move together.

**Acceptance Scenarios**:

1. **Given** an existing save where all party members share a tile, **When** the save is restored, **Then** all characters appear on that shared tile and unified movement is active.
2. **Given** a legacy save where characters are on different tiles (pre-feature), **When** the save is restored, **Then** all party members are relocated to the PC's tile before the player can take any action.

---

### Edge Cases

- What happens when a party member is dead or inactive? Dead/inactive characters still travel with the party (carried/escorted) — they do not block movement.
- What if pathfinding returns different path lengths for different party members (they're on the same tile so this shouldn't happen, but is guarded)? The party always shares a starting tile so a single path is computed from the shared position.
- What if the destination tile triggers combat? Only the party's shared destination matters — combat launches once, not per-character.
- What if the party has only one member (e.g., the Ward was lost)? Movement works the same; the single survivor moves to the destination.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When the player clicks a passable, reachable tile on the world map, the system MUST move **all** active party members to that destination tile in a single action.
- **FR-002**: Movement MUST be computed using a single path from the party's shared current tile to the destination; the path is applied to all party members simultaneously.
- **FR-003**: Tapping a character sprite MUST update the active stat display and camera focus but MUST NOT change which characters participate in the next movement action.
- **FR-004**: All party member sprites MUST animate to the destination tile simultaneously when movement occurs.
- **FR-005**: All party members MUST share the same tile coordinate in the data model at all times on the world map after this feature is released.
- **FR-006**: If a saved game contains party members on different tiles (legacy data), the system MUST relocate all non-PC members to the PC's tile before the first player action.
- **FR-007**: Tile exploration MUST be triggered once per move, not once per character moved.
- **FR-008**: POI interactions (town panel, combat trigger) MUST fire based on the party's shared destination, not per individual character arrival.
- **FR-009**: Auto-save checkpoints MUST capture all party members' shared position correctly.

### Key Entities

- **Party**: The full set of `Character` objects belonging to the player. All members share a single world-map tile at all times (their `occupants` entry in the hex grid).
- **Active Character**: The character whose stats are shown in the stat panel and who the camera follows. Selection does not affect movement scope.
- **Shared Tile**: The single `HexTile` that records all party member IDs in its `occupants` array.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After clicking any reachable tile, 100% of party members are on the destination tile (0 characters left behind) — verifiable by inspecting `tile.occupants` in the data model.
- **SC-002**: All party member sprites complete their move animation to the destination within the same animation duration (no staggered arrivals).
- **SC-003**: Clicking a character sprite and then a destination tile results in all party members moving — this is provable in under 5 seconds of play.
- **SC-004**: A save/load round-trip preserves the single shared tile for all party members, with no character on a different tile after restore.
- **SC-005**: Legacy saves with characters on different tiles are automatically repaired on load with no visible error or freeze.

## Assumptions

- The party always starts on the same tile (this is already true in `buildParty()`) — no changes needed to initial placement.
- The game uses a turn-based world map where the player moves one step at a time; there is no simultaneous AI movement on the world map that could interleave with party movement.
- Combat scenes manage individual character positioning independently; this feature only affects the world map scene.
- The Ward is always present at game start; adventurers recruited at towns may also be party members and should also benefit from unified movement.
- Mobile/touch input (tap) is treated the same as mouse click for the purposes of tile selection.
- The `selectedChar` field is retained for stat panel display and camera focus; its role is narrowed, not removed.
