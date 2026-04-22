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
