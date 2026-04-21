# Module Contracts: Hex Crawl Game — Core Experience

**Branch**: `001-hex-crawl-game` | **Date**: 2026-04-21

This game is a browser application with no external API. Contracts here define the **inter-module interfaces** — the stable boundaries between the decoupled modules required by Constitution Principle III (Component/Module Separation) and Principle IV (Composability & Reusability).

Any module may call a contract method; **no module may reference another module's internals**.

---

## Contract Index

| Contract File | Module Boundary |
|---|---|
| [hex-grid.contract.md](hex-grid.contract.md) | HexGridModule ↔ all consumers |
| [combat.contract.md](combat.contract.md) | CombatModule ↔ GameLoop, UI |
| [save.contract.md](save.contract.md) | SaveModule ↔ GameLoop, UI |
| [recruitment.contract.md](recruitment.contract.md) | RecruitmentModule ↔ WorldMap, CombatModule |
| [meta-progression.contract.md](meta-progression.contract.md) | MetaProgressionModule ↔ SaveModule (v1 stub) |

---

## Conventions

- All module interfaces are TypeScript `interface` types.
- Modules expose **factory functions** (`createHexGridModule()`) or **classes** with a public interface; internal helpers are not exported.
- Modules are **event-emitter friendly**: consumers subscribe to events rather than polling state.
- Module implementations live under `src/modules/<module-name>/`.
- Each module ships with its own `index.ts` re-exporting only the public interface.
