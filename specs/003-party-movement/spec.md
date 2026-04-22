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

### User Story 4 - Character Death Removes Them from Party (Priority: P2)

When a party member is killed (e.g., returning from combat), they leave the party permanently. Their sprite disappears from the world map, a death marker appears on the tile they last occupied, and the party's movement range is recalculated without their DEX contribution.

**Why this priority**: Directly affects movement range and party display. Without this, dead characters ghost around the map and incorrectly contribute to (or inflate) movement range.

**Independent Test**: Enter combat, allow a non-PC character to die, return to the world map. Confirm: (1) the dead character's sprite is gone, (2) a named death marker appears on their last tile, (3) the movement range has been recalculated.

**Acceptance Scenarios**:

1. **Given** a party member just died in combat, **When** the world map is shown, **Then** that character's sprite does not appear and their ID is absent from the party roster.
2. **Given** a character died on tile (q=3, r=2), **When** the world map renders, **Then** a death marker showing that character's name appears on tile (3, 2).
3. **Given** a high-DEX character was in the party, **When** they die, **Then** the movement range shown to the player decreases to reflect their absence.

---

### Edge Cases

- What happens when a party member is dead or inactive? Dead **non-PC** characters are removed from the party roster and the world map. A death marker is placed on their last tile. They do not contribute to movement range. PC death triggers the run-over condition via the existing `RunEndDetector` flow and does not reach world-map cleanup logic.
- What if pathfinding returns different path lengths for different party members (they're on the same tile so this shouldn't happen, but is guarded)? The party always shares a starting tile so a single path is computed from the shared position.
- What if the A* path to a destination exceeds the **remaining turn budget**? The path is truncated to the last tile within the remaining budget; the party moves there. POI triggers fire based on the truncated endpoint. The remaining budget decrements accordingly.
- What if the player has 0 remaining turn budget? All tile clicks are silently ignored. The highlight overlay shows no reachable tiles. The player must end their turn to refresh.
- What if the destination tile triggers combat? Only the party's shared destination matters — combat launches once, not per-character.
- What if the party has only one member (e.g., the Ward was lost)? Movement works the same; the single survivor moves to the destination.
- What if no path exists to the hovered tile? The path preview is hidden; no error or crash occurs.
- What if the hovered tile is the party's current tile? No path is shown.
- What if the player hovers over an unexplored (fogged) tile? A* still computes the path but the preview renders over the fog; clicking an unreachable fogged tile is still rejected.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When the player clicks a tile on the world map, the system MUST compute the A* path from the party's shared tile to the destination. If any portion of that path falls within the movement range budget, the party MUST move to the last passable tile on the path that is within the budget (path truncation). If the path is zero steps (impassable or no path found), the click is silently ignored.
- **FR-002**: Movement MUST be computed using a single A* path from the party's shared current tile to the clicked destination. If the full path exceeds the **remaining turn budget**, the path MUST be truncated to the last tile within the remaining budget; the party moves to that truncated endpoint. The (possibly truncated) path is applied to all party members simultaneously. The remaining turn budget MUST be decremented by the number of tiles actually traversed.
- **FR-010**: Movement is **turn-based**. At the start of each turn, the party receives a tile budget equal to `Math.max(MIN_PARTY_MOVE_RANGE, 1 + sum(dexModifier(m) for m in party where m.status === 'active'))` where `dexModifier(stat) = Math.ceil((stat − 10) / 2)`, giving: stat 10 → +0, 11–12 → +1, 13–14 → +2, 8–9 → −1, 6–7 → −2, etc. `MIN_PARTY_MOVE_RANGE` is a named tunable constant (default: 2). The budget depletes across multiple clicks within the same turn; each move subtracts tiles traversed from the remaining budget. When the remaining budget reaches 0, all further clicks are silently ignored until the turn refreshes. The turn refresh trigger is defined by the narrative/encounter layer (see FR-016).
- **FR-015**: The remaining turn budget MUST be displayed to the player at all times while on the world map (e.g., a numeric label or pip indicator). The tile highlight overlay MUST reflect the remaining budget (not the full turn budget), updating after each move.
- **FR-016**: The turn budget MUST be fully refreshed (reset to the full formula value) when a defined turn-boundary event occurs. Turn-boundary events include at minimum: returning from a combat scene, returning from a town panel, and an explicit "End Turn" player action. Additional narrative triggers may be added by the game layer without modifying the movement system.
- **FR-011**: The movement range MUST be recalculated any time the party composition changes (character joins, leaves, or dies).
- **FR-012**: The movement range for the current action MUST be visually communicated to the player via two mechanisms:
  - **Tile highlight**: All passable tiles within the computed movement range MUST receive a visible colour overlay distinguishing them from out-of-range tiles.
  - **Hover path preview**: When the player hovers the cursor over any tile, the system MUST compute an A* path from the party's current tile to the hovered tile (using cube coordinates) and render it as a line/overlay — yellow for the portion of the path within movement range, red for any portion beyond the movement range. The preview updates live as the cursor moves and disappears when the cursor leaves the map. Path computation MUST be throttled: the A* calculation is only performed when the cursor enters a **new** tile; if the pointer moves within the same tile the previous result is reused.
- **FR-013**: When a **non-PC** character's `status` transitions to `'dead'`, that character MUST be immediately removed from the active party roster. Their sprite MUST be removed from the world map. The movement range MUST be recalculated. PC death is handled exclusively by the existing run-end flow (`RunEndDetector`) and MUST NOT reach this world-map removal path.
- **FR-014**: When a character dies on the world map, a persistent death marker (a distinct visual indicator) MUST be placed on the tile where they died, visible for the remainder of the run. The marker MUST display the character's name at minimum. Death marker positions and names MUST be serialised into the save file (as `{ coord: HexCoord, name: string }` entries) so they survive save/load cycles; on restore, all recorded markers MUST be rendered before the player can take any action.
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
- **SC-009**: After a save/load cycle, all death markers recorded in the save (name + coordinate) are rendered on the world map within one render frame of the scene being ready, with no markers missing.
- **SC-006**: The full turn budget equals `Math.max(MIN_PARTY_MOVE_RANGE, 1 + sum(Math.ceil((m.dex - 10) / 2) for active m in party))` and updates immediately when the party roster changes. The displayed remaining budget decrements by tiles traversed after each move and resets to the full value on each turn-boundary event.
- **SC-007**: After a character dies (status → `'dead'`), their sprite is absent from the world map and a named death marker is visible on the tile they last occupied within one render frame.
- **SC-008**: The movement range recalculates within one frame of a character's death, with no stale range shown to the player.

## Clarifications

### Session 2026-04-21

- Q: Is world-map movement unlimited (click any reachable tile) or does it use a per-action budget? → A: Stamina/resource-based — party has a **movement range** per action that depletes with distance, derived from DEX modifiers.
- Q: What is the minimum movement range floor? → A: 2 tiles — exposed as a named tunable constant (`MIN_PARTY_MOVE_RANGE`) so it can be adjusted during playtesting without touching the formula.
- Q: What is the minimum movement range floor, and should it be tunable? → A: Minimum = 2 tiles, exposed as a named constant (`MIN_PARTY_MOVE_RANGE = 2`) so it can be adjusted during playtesting without touching the formula.
- Q: Should dead/inactive characters contribute their DEX to the movement range formula? → A: No — only `status === 'active'` characters contribute. Furthermore, when a character dies they MUST be removed from the active party entirely and a death marker MUST be placed on the world map tile where they died. Dead characters no longer appear as sprites on the map.
- Q: Should death markers persist through save and reload? → A: Yes — death marker positions and names (as `{ coord, name }` entries) are serialised into the save file and restored on every load.
- Q: What feedback should out-of-range tile clicks give the player? → A: Silent ignore — clicks on out-of-range tiles produce no observable effect (no toast, no flash, no animation).
- Q: When a clicked tile's A* path exceeds the movement range, should the party stop mid-path or is the click ignored? → A: Path truncation — the party moves to the last tile within the budget; the click is never ignored if any portion of the path is reachable.
- Q: What happens if the PC (Hero) dies — run over or continue? → A: PC death is a game-over / run-end condition. FR-013 and FR-014 (roster removal, death marker) apply to non-PC party members only.
- Q: Does movement range reset each action or is it a fixed per-turn budget? → A: Fixed per-turn budget — depletes across multiple clicks within a turn, refreshes on turn-boundary events (combat exit, town exit, explicit End Turn). Aligns with combat turn model and enables narrative hooks between turns.

## Assumptions

- The party always starts on the same tile (this is already true in `buildParty()`) — no changes needed to initial placement.
- The game uses a turn-based world map where the player moves one step at a time; there is no simultaneous AI movement on the world map that could interleave with party movement.
- Combat scenes manage individual character positioning independently; this feature only affects the world map scene.
- The Ward is always present at game start; adventurers recruited at towns may also be party members and should also benefit from unified movement.
- PC death is a game-over / run-end condition handled by the existing `RunEndDetector` and `RunEnd` scene. The world-map party-removal and death-marker logic (FR-013, FR-014) applies exclusively to non-PC party members.
- Movement is turn-based. The per-turn tile budget depletes across multiple clicks and refreshes on defined turn-boundary events (returning from combat, returning from town, or explicit "End Turn" action). This aligns with the combat system's turn model and creates narrative space between turns.
- Mobile/touch input (tap) is treated the same as mouse click for the purposes of tile selection.
- The `selectedChar` field is retained for stat panel display and camera focus; its role is narrowed, not removed.
