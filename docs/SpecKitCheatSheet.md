# Spec Kit Cheat Sheet

> Quick reference for the full Spec-Driven Development workflow, idea to implementation.

---

## The Full Workflow

```
1. /speckit.specify       →  generates spec.md
2.  👀 Review spec.md
3. /speckit.clarify       →  de-risks ambiguities (optional, recommended)
4. /speckit.plan          →  generates plan.md + design artifacts
5.  👀 Review plan.md
6. /speckit.tasks         →  generates tasks.md
7. /speckit.analyze       →  audits all artifacts (optional, recommended)
8.  👀 Review findings
9. /speckit.implement     →  writes the code
```

---

## Step-by-Step

### Step 1 — Generate the Spec
```
/speckit.specify <your idea in plain language>
```
- Generates `spec.md` in `.specify/features/<feature>/`
- Contains user stories, functional requirements, success criteria, and key entities
- May flag up to **3 ambiguous areas** with `[NEEDS CLARIFICATION]` markers

---

### Step 2 — Review `spec.md`
- Read through the generated spec
- Edit anything that doesn't match your intent
- Resolve any `[NEEDS CLARIFICATION]` markers before moving on

---

### Step 3 — Clarify Ambiguities ⭐ _optional, recommended_
```
/speckit.clarify
```
- Scans `spec.md` for underspecified areas
- Asks up to **5 targeted questions**, one at a time
- Provides a **recommended answer** for each — reply `yes` to accept
- Writes answers directly back into `spec.md`
- Run this **before** `/speckit.plan` to reduce downstream rework

> Skip if your spec is already well-defined or you're doing an exploratory spike.

---

### Step 4 — Generate the Technical Plan
```
/speckit.plan
```
- Reads `spec.md` and generates `plan.md` + supporting artifacts:
  - `data-model.md` — entities and relationships
  - `contracts/` — API or interface contracts
  - `research.md` — tech decisions and rationale
  - `quickstart.md` — key validation scenarios

---

### Step 5 — Review `plan.md`
- Check the tech stack, architecture, and structure
- Make sure all decisions align with your intent before tasks are generated

---

### Step 6 — Generate Tasks
```
/speckit.tasks
```
- Reads `spec.md` + `plan.md` and generates `tasks.md`
- Tasks are:
  - Ordered by dependency (setup → foundational → user stories by priority → polish)
  - Marked with `[P]` where parallel execution is possible
  - Each task includes exact file paths

---

### Step 7 — Analyze for Consistency ⭐ _optional, recommended_
```
/speckit.analyze
```
- **Read-only** — does not modify any files
- Cross-checks `spec.md`, `plan.md`, and `tasks.md` for:

| Check | What it catches |
|---|---|
| Coverage gaps | Requirements with no associated tasks |
| Orphaned tasks | Tasks not tied to any requirement |
| Inconsistencies | Terminology drift, conflicting requirements |
| Ambiguity | Vague terms (e.g. "fast", "secure") with no measurable target |
| Constitution violations | Anything breaking your project's architectural principles |

- Issues are rated: **CRITICAL** / **HIGH** / **MEDIUM** / **LOW**
- Will tell you explicitly whether it's safe to proceed to implement

> Resolve any CRITICAL or HIGH issues before moving on.

---

### Step 8 — Review Findings
- Read through the analysis report
- Fix any CRITICAL/HIGH findings (re-run the relevant command if needed)
- MEDIUM/LOW issues can often be addressed later

---

### Step 9 — Implement
```
/speckit.implement
```
- Works through `tasks.md` top-to-bottom
- Checks off each `- [ ]` task as it completes it
- Halts and reports if a task fails
- Validates the final result against `spec.md`

---

## Quick Reference Table

| Step | Command | What it produces | Modifies files? |
|---|---|---|---|
| 1 | `/speckit.specify` | `spec.md` | ✅ Yes |
| 2 | 👀 Review | — | — |
| 3 | `/speckit.clarify` | Updated `spec.md` | ✅ Yes (spec only) |
| 4 | `/speckit.plan` | `plan.md`, `data-model.md`, `contracts/`, `research.md` | ✅ Yes |
| 5 | 👀 Review | — | — |
| 6 | `/speckit.tasks` | `tasks.md` | ✅ Yes |
| 7 | `/speckit.analyze` | Analysis report (in chat) | ❌ Read-only |
| 8 | 👀 Review findings | — | — |
| 9 | `/speckit.implement` | Your code | ✅ Yes |

---

## Run Everything Automatically

Skip the manual steps and run the full pipeline with review gates:

```bash
specify workflow run speckit -i spec="<your idea here>"
```

- Runs `specify → plan → tasks → implement` automatically
- Pauses at each **review gate** for your approval before continuing
- Approve with `specify workflow resume`, or reject to abort

---

## Tips

- 🔁 You can re-run `/speckit.clarify` after planning if new ambiguities surface
- 🔁 You can re-run `/speckit.analyze` at any time before implementation
- ⚠️ Always resolve CRITICAL issues from `/speckit.analyze` before running `/speckit.implement`
- 📁 All artifacts live in `.specify/features/<feature-name>/`
- 🧠 Your project's architectural rules live in `.specify/memory/constitution.md`