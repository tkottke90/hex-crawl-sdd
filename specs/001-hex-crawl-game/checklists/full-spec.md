# Full-Spec Requirements Quality Checklist: Hex Crawl Game — Core Experience

**Purpose**: Validate the quality, completeness, clarity, and measurability of all requirements across all FRs and User Stories before implementation begins  
**Created**: 2026-04-21  
**Feature**: [spec.md](../spec.md)  
**Focus**: Full spec coverage (FR-001–FR-016, US1–US5, Edge Cases, Success Criteria)  
**Depth**: Thorough — includes NFRs, measurability, and edge case coverage  
**Audience**: Author self-review before implementation starts

---

## Requirement Completeness

- [ ] CHK001 — Are requirements defined for whether the map seed is visible to the player and shareable between players, or is seed usage purely internal? [Completeness, Spec §FR-001a, Gap]
- [ ] CHK002 — Are density/distribution rules (how many towns, encounter zones, and POIs per map) specified, or is that left to implementation discretion? [Completeness, Spec §FR-001a, Gap]
- [X] CHK003 — Are character attribute ranges and initial values at character creation documented, or are STR/DEX/CON/INT/WIS/CHA only named without generation rules? [Completeness, Spec §FR-003, Key Entities – Character, Gap]
- [X] CHK004 — Are XP thresholds (amounts needed per level) and whether the curve is class-specific or universal documented in requirements? [Completeness, Spec §FR-006, Gap]
- [X] CHK005 — Are per-class growth rates (stat increases per level-up) specified with concrete values or ranges, or only noted as a Class entity field? [Completeness, Spec §FR-006, Key Entities – Class, Gap]
- [ ] CHK006 — Are promotion thresholds (exact level or condition) specified beyond "at defined level thresholds"? [Completeness, Spec §FR-007, Ambiguity]
- [ ] CHK007 — Are the minimum two class-evolution paths named or described, or is only the count constraint documented? [Completeness, Spec §FR-007, Gap]
- [X] CHK008 — Are requirements defined for what constitutes full party defeat in Casual mode — is "last character incapacitated" a run-ending condition or does recovery apply? [Completeness, Spec §FR-013, Gap]
- [X] CHK009 — Is the Casual-mode recovery mechanic specified — how does an incapacitated character return to the active roster and under what conditions? [Completeness, Spec §FR-013, Gap]
- [X] CHK010 — Are all terrain types fully enumerated with their passability rules and movement costs, or are terrain types only referenced by example? [Completeness, Spec §Key Entities – HexTile, Gap]
- [ ] CHK011 — Are requirements defined for the main menu structure and all navigable flows beyond mode select and load game? [Completeness, Gap]
- [X] CHK012 — Are town interaction requirements specified beyond "level 1 heroes available for hire" — what is shown, how is hiring confirmed, and what costs are involved? [Completeness, Spec §FR-012a, Gap]
- [ ] CHK013 — Is the recruitment offer UI flow specified — exactly when the offer appears, what information is shown, and what player actions are available for the FR-012b encounter? [Completeness, Spec §FR-012b, Gap]
- [ ] CHK014 — Are save slot requirements defined — how many slots exist in Casual mode, and is there a slot naming, overwriting, or deletion UI? [Completeness, Spec §FR-008, Gap]
- [ ] CHK015 — Are requirements defined for how "game version" is stored in SaveState and what constitutes a breaking version mismatch for import validation? [Completeness, Spec §Key Entities – SaveState, Edge Cases, Gap]
- [ ] CHK016 — Are stat block panel interaction requirements specified beyond "accessible at any time outside combat" — trigger, position, dismissal, and in-combat read-only access? [Completeness, Spec §FR-003, Gap]

---

## Requirement Clarity

- [ ] CHK017 — Is "accessible at any time outside combat" (FR-003) defined precisely — does it include town screens, world map, level-up events, and cutscene/splash states? [Clarity, Spec §FR-003, Ambiguity]
- [ ] CHK018 — Is the visual indicator for a "marked exhausted" unit (FR-004a) specified — are there explicit requirements for how the player identifies which units have acted? [Clarity, Spec §FR-004a, Gap]
- [X] CHK019 — Is "higher-level friendly NPC" (FR-012b) quantified — are level ranges relative to the current party level defined? [Clarity, Spec §FR-012b, Ambiguity]
- [ ] CHK020 — Is "trigger probability < 10%" (FR-012b) defined as per-encounter-tile-entry, per-run, or another unit — and is this threshold measurably testable? [Clarity, Spec §FR-012b, Measurability]
- [X] CHK021 — Is simultaneous last-character death in Roguelike mode covered — does FR-014 address whether a run ends when the final action kills all remaining characters at once? [Clarity, Spec §FR-014, Ambiguity]
- [ ] CHK022 — Is "persistently displayed in the HUD" (FR-015) expressed with layout or position requirements, or is placement left entirely to implementation? [Clarity, Spec §FR-015, Gap]
- [ ] CHK023 — Is "classic high fantasy tone" (FR-016) expressed with any measurable visual or UX criteria beyond aesthetic description? [Clarity, Spec §FR-016, Measurability]
- [X] CHK024 — Are file format, naming convention, and version stamp specified for exported save files (FR-010) — or is "downloadable file" the only constraint? [Clarity, Spec §FR-010, Ambiguity]
- [ ] CHK025 — Is "100% of game state" (SC-004) defined with a concrete list of fields that must round-trip through export/import? [Clarity, Spec §SC-004, Ambiguity]
- [ ] CHK026 — Is the start event for the "under 3 minutes" success criterion (SC-001) defined — browser tab open, first click, or game fully loaded? [Clarity, Spec §SC-001, Ambiguity]
- [X] CHK027 — Are the mechanical impacts of core attributes (STR, DEX, CON, etc.) on dice roll calculations documented anywhere in the spec or contracts? [Clarity, Spec §FR-005, Key Entities – Character, Gap]

---

## Requirement Consistency

- [X] CHK028 — Does FR-009 ("auto-save on each Enemy Phase end") align with US4-Scenario-5 ("resumes from last auto-save checkpoint") — do "continuous event-driven saves" and "checkpoint" refer to the same thing? [Consistency, Spec §FR-009, US4-Scenario-5]
- [ ] CHK029 — Are FR-012a (towns) and FR-012b (rare encounters) sufficient to grow a party from 2 to 8 — is it possible for neither path to yield enough recruits across a run? [Consistency, Spec §FR-012, FR-012a, FR-012b]
- [ ] CHK030 — Is multi-tier promotion consistently modeled: FR-007 permits multiple evolutions, but Key Entities – Class defines one promotionThresholds field — are multiple promotions per character accounted for? [Consistency, Spec §FR-007, Key Entities – Class]
- [X] CHK031 — Do US3-Scenario-2 ("at least two promotion options") and FR-007 ("at least two class-evolution paths") consistently reference the same threshold and minimum count? [Consistency, Spec §FR-007, US3-Scenario-2]
- [ ] CHK032 — FR-003 grants stat block access "at any time outside combat" and FR-004b allows observation during enemy phase — are stat block access requirements consistent for in-combat observation mode? [Consistency, Spec §FR-003, FR-004b]
- [ ] CHK033 — Edge Cases lists incompatible save file version load, but FR-008 through FR-011 contain no version mismatch handling requirements — is this intentionally deferred or an unresolved gap? [Consistency, Spec §Edge Cases, FR-011, Gap]

---

## Acceptance Criteria Quality

- [ ] CHK034 — US1-Scenario-2 ("map updates") — is this criterion measurable without specifying what visible feedback (animation, highlight, indicator) confirms a successful move? [Measurability, Spec §US1-Scenario-2]
- [ ] CHK035 — US2-Scenario-2 states dice results are displayed "before damage is applied" — is the display duration, dismissal mechanism, or player acknowledgement step required? [Measurability, Spec §US2-Scenario-2]
- [ ] CHK036 — SC-002 ("within 500 ms") — are the measurement start event (button press vs. animation start) and end event (UI drawn vs. value visible) explicitly defined? [Measurability, Spec §SC-002]
- [X] CHK037 — SC-005 ("stable 60 fps on a mid-range device") — is "mid-range device" expressed with concrete hardware benchmarks, or is this criterion untestable as written? [Measurability, Spec §SC-005]
- [ ] CHK038 — US5-Scenario-3 states mode is "always visible" — are the exceptions to "always" (loading screens, splash, main menu) documented to bound the requirement? [Measurability, Spec §US5-Scenario-3, FR-015]
- [ ] CHK039 — SC-007 ("100% of stat values and dice components visible") — is the mechanism (always rendered vs. accessible on demand) consistently specified across all game states? [Measurability, Spec §SC-007, FR-003, FR-005]

---

## Scenario Coverage

- [ ] CHK040 — Are requirements defined for the new-game onboarding flow — is there a tutorial, mode explanation, or introductory narrative, and can it be skipped? [Coverage, Gap]
- [X] CHK041 — Are requirements defined for the failed recruitment scenario (NPC dies before player wins) — what feedback is given and does the encounter resolve differently? [Coverage, Spec §Edge Cases, FR-012b]
- [ ] CHK042 — Are requirements defined for combat timeout or stalemate — is there a mechanism preventing infinite combat if neither side can deal lethal damage? [Coverage, Gap]
- [X] CHK043 — Is the full Roguelike run-end flow specified — what screens are shown after permadeath, what run summary is displayed, and how the player returns to the main menu? [Coverage, Gap]
- [X] CHK044 — Are multi-unit movement ordering requirements defined in the Player Phase — can the player move units in any order before acting, or must move + action complete per unit? [Coverage, Spec §FR-004a, Ambiguity]
- [X] CHK045 — Are requirements defined for "undo move" — can the player reverse a character's movement after initiating it but before committing an action? [Coverage, Gap]
- [X] CHK046 — Are requirements specified for end-of-combat resolution screen — what summary information (XP earned, casualties, loot) is shown before returning to the world map? [Coverage, Gap]
- [X] CHK047 — Are requirements specified for world-map state after combat resolves — is the enemy tile cleared, replaced by a different POI type, or left permanently empty? [Coverage, Gap]
- [X] CHK048 — Are world-map navigation requirements specified — is it click-to-move adjacency, path-planning, or free roam, and is fog-of-war part of the design? [Coverage, Spec §FR-001, Gap]

---

## Edge Case Coverage

- [ ] CHK049 — Is the browser storage quota exhaustion scenario (listed in Edge Cases) backed by any requirement in FR-008 specifying the error state and whether partial writes are rolled back? [Edge Case, Spec §Edge Cases, FR-008, Gap]
- [X] CHK050 — Is the "browser closed during save write" scenario (listed in Edge Cases) backed by any integrity-check or write-completion validation requirement in FR-009? [Edge Case, Spec §Edge Cases, FR-009, Gap]
- [ ] CHK051 — Is the multi-occupant hex tile scenario (listed in Edge Cases) backed by a requirement defining whether simultaneous tile occupancy is permitted and what blocks movement? [Edge Case, Spec §Edge Cases, Key Entities – HexTile, Gap]
- [X] CHK052 — Are natural 1 / natural 20 equivalents (listed in Edge Cases) backed by any requirement in FR-005 specifying critical hit/miss rules and how they are displayed? [Edge Case, Spec §Edge Cases, FR-005, Gap]
- [X] CHK053 — Is reaching the 8-character party cap during a recruitment encounter (listed in Edge Cases) backed by a requirement specifying whether the encounter still fires and what message is shown? [Edge Case, Spec §Edge Cases, FR-012, Gap]
- [X] CHK054 — Is "town stock depleted" (listed in Edge Cases) backed by a requirement in FR-012a specifying restock behavior, minimum availability, or a notification message? [Edge Case, Spec §Edge Cases, FR-012a, Gap]
- [X] CHK055 — Is the incompatible save file version import scenario (listed in Edge Cases) backed by a requirement in FR-011 specifying the error message shown and whether partial recovery is attempted? [Edge Case, Spec §Edge Cases, FR-011, Gap]

---

## Non-Functional Requirements

- [ ] CHK056 — Are accessibility requirements (keyboard-only navigation, screen reader support, colorblind palette) specified for v1, even if explicitly deferred? [NFR, Gap]
- [ ] CHK057 — Are requirements defined for game startup time from browser tab open to main menu interactive — is there an acceptable upper bound? [NFR, Spec §SC-001, Gap]
- [ ] CHK058 — Are IndexedDB storage size estimates or per-save-slot size limits documented to bound the storage footprint? [NFR, Spec §Assumptions, Gap]
- [X] CHK059 — Are supported browsers and minimum browser versions specified, or is "modern browser" left undefined? [NFR, Spec §Assumptions, Gap]
- [X] CHK060 — Are security requirements defined for imported save files — is Zod parse sufficient, or are requirements needed for malformed/malicious payload handling? [NFR, Gap]
- [ ] CHK061 — Are performance requirements defined for procedural map generation time — how long is acceptable and does it count within the SC-001 "under 3 minutes" window? [NFR, Spec §SC-001, FR-001, Gap]
- [ ] CHK062 — Are performance requirements specified for enemy AI turn resolution — is there a ceiling on how long the AI may compute before the result is surfaced to the player? [NFR, Gap]

---

## Dependencies & Assumptions

- [ ] CHK063 — Is the "mobile/touch out of scope" assumption reflected with explicit exclusion language in any FR, or could an FR inadvertently imply responsive/touch UI? [Assumption, Spec §Assumptions]
- [X] CHK064 — Is the "audio is a stretch goal" stance consistently applied across all FRs — do any FRs or success criteria implicitly depend on audio for UX feedback that would fail silently without it? [Assumption, Spec §FR-016, Gap]
- [X] CHK065 — Is the composable `MetaProgressionModule` interface requirement (Constitution Principle IV) expressed with a concrete contract stub, or only as a narrative assumption? [Dependency, Spec §Assumptions, Key Entities – MetaProgressionModule]
- [ ] CHK066 — Is the PhaserJS 3 dependency pinned to a specific version, and are any known v3 API deprecation risks within v1 scope documented? [Dependency, Spec §Assumptions, Gap]
- [X] CHK067 — Is the "no server dependency" assumption validated against all FRs — could any FR implicitly rely on network access (CDN fonts, external assets) that contradicts the local-first guarantee? [Assumption, Spec §FR-001, Spec §Assumptions]
