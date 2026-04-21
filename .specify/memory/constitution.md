<!--
  SYNC IMPACT REPORT
  Version change: (unversioned) → 1.1.0
  Added sections: Core Principles (I–IV), Tech Stack, Development Workflow, Governance
  Removed sections: N/A (initial fill)
  Templates checked:
    ✅ plan-template.md — Constitution Check section present; no updates needed
    ✅ spec-template.md — no principle-driven mandatory sections changed
    ✅ tasks-template.md — no new principle-driven task types required
  Deferred TODOs: None
-->

# My First Hex Game Constitution

## Core Principles

### I. Simple & Playable First

A working game loop MUST exist before any polish, optimization, or advanced feature
is added. YAGNI applies at every milestone: only build what the current user story
requires. Complexity MUST be justified by a concrete, testable need — not speculation.
Every feature branch MUST leave the game in a playable state when merged.

### II. Test-Driven Development (NON-NEGOTIABLE)

Tests MUST be written and approved before implementation begins.
The Red-Green-Refactor cycle is strictly enforced:
- Write a failing test that captures the requirement.
- Implement the minimum code to make it pass.
- Refactor without changing observable behavior.

No production code may be merged without a corresponding passing test.

### III. Component/Module Separation

Game logic, rendering, and input handling MUST be implemented as independent modules
with explicit, stable interfaces between them. No module may directly reference the
internals of another. This enables independent testing of each concern and makes
future renderer or input swaps non-breaking.

### IV. Composability & Reusability

All game features MUST be implemented as composable modules that can be added, removed, or replaced without affecting the core game loop. This allows for flexible iteration and
future expansion without refactoring the entire codebase. Each module should have a clear API and be decoupled from other modules.

Likewise, reuseable utility systems should be designed such that they are ignorant to the larger nuance of where they are used.

### V. All Features are Built from `main`

All new features/branches are build on top of main.  This is best practice for git and with it we practice Trunk Flow where main is the deployable single source of truth and the feature branches are short lived and merged back into main as soon as the feature is complete.  This ensures that we always have a working version of the game in main and reduces the risk of merge conflicts and integration issues.

## Tech Stack

- **Language**: TypeScript (strict mode enabled)
- **Runtime**: Browser (no Node.js server required)
- **Testing**: Vitest (unit) + Playwright (e2e/integration)
- **Bundler**: Vite
- **Target Browsers**: Modern evergreen (Chrome, Firefox, Safari, Edge — latest 2 versions)
- **Performance Goal**: Stable 60 fps on mid-range hardware

## Development Workflow

- All work MUST happen on a feature branch following the naming convention
  `###-short-description` (sequential numbering).
- A Constitution Check MUST be performed in every plan.md before implementation begins,
  verifying the planned approach complies with Principles I–IV.
- PRs MUST NOT be merged if any test is failing or if the game is left in a
  non-playable state.
- Complexity exceeding a single user story MUST be split into additional stories
  before implementation.

## Governance

This constitution supersedes all other development practices. Amendments require:
1. A documented rationale explaining what changed and why.
2. A version bump following semantic versioning:
   - MAJOR: removal or redefinition of a principle.
   - MINOR: new principle or section added.
   - PATCH: clarifications, wording, or formatting changes.
3. A migration plan if existing code is affected.

All plan reviews MUST include a Constitution Check verifying compliance.

**Version**: 1.1.0 | **Ratified**: 2026-04-21 | **Last Amended**: 2026-04-21
