# Quickstart: Hex Crawl Game — Dev Setup

**Branch**: `001-hex-crawl-game` | **Date**: 2026-04-21

---

## Prerequisites

- Node.js ≥ 20 (LTS)
- npm ≥ 10 (bundled with Node 20)
- Modern browser (Chrome / Firefox / Edge / Safari latest)

---

## 1. Scaffold the project

```bash
# Clone the official Phaser + Vite + TypeScript template
npm create phaser@latest my_first_hex_game -- --template vite-ts
cd my_first_hex_game

# Remove the anonymous analytics script (optional but recommended)
# Delete src/log.js and remove the <script> tag in index.html that loads it
```

---

## 2. Install dependencies

```bash
# Core runtime deps
npm install phaser
npm install idb          # IndexedDB wrapper for save storage
npm install zod          # Runtime schema validation for save files
npm install simplex-noise # Seeded noise for procedural map generation

# TailwindCSS v4 (Vite plugin — no PostCSS config needed)
npm install -D @tailwindcss/vite

# Testing
npm install -D vitest @vitest/coverage-v8
npm install -D playwright @playwright/test
```

---

## 3. Configure Vite

`vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
  },
});
```

---

## 4. Configure TypeScript

`tsconfig.json` (key settings):
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "strictPropertyInitialization": false,
    "noEmit": true,
    "isolatedModules": true
  }
}
```

> `strictPropertyInitialization: false` is required because Phaser scenes assign members in `create()`, not the constructor.

---

## 5. Add Tailwind CSS

`src/style.css`:
```css
@import "tailwindcss";
```

Import in `src/main.ts`:
```typescript
import './style.css';
```

---

## 6. Source layout

```
src/
├── main.ts                  # App entry — mounts Phaser game + imports CSS
├── style.css                # Tailwind import
├── game/
│   ├── main.ts              # Phaser Game config + scene registry
│   └── scenes/
│       ├── Boot.ts
│       ├── Preloader.ts
│       ├── MainMenu.ts
│       ├── WorldMap.ts      # Hex world map + exploration
│       └── Combat.ts        # Tactical hex combat
├── modules/
│   ├── hex-grid/            # HexGridModule implementation
│   ├── combat/              # CombatModule implementation
│   ├── save/                # SaveModule implementation
│   ├── recruitment/         # RecruitmentModule implementation
│   └── meta-progression/    # MetaProgressionModule stub
├── models/                  # TypeScript interfaces (data-model.md types)
├── schemas/                 # Zod schemas (mirrors models/)
└── utils/                   # Pure helpers: dice roller, PRNG, noise

tests/
├── unit/                    # Vitest unit tests per module
│   ├── hex-grid/
│   ├── combat/
│   ├── save/
│   └── recruitment/
└── e2e/                     # Playwright end-to-end tests
    ├── new-game.spec.ts
    ├── combat.spec.ts
    └── save-load.spec.ts

public/
└── assets/                  # Static assets served by Vite
    ├── tilemaps/
    ├── tilesets/
    └── portraits/
```

---

## 7. Dev commands

```bash
npm run dev       # Start Vite dev server (localhost:5173)
npm run build     # Production build → dist/
npm run preview   # Preview production build locally

npm run test      # Vitest unit tests (watch mode)
npm run test:run  # Vitest single run
npm run coverage  # Vitest with v8 coverage report

npx playwright test           # Run e2e tests (requires dev server or preview)
npx playwright test --ui      # Playwright interactive UI
```

---

## 8. Verify the setup

After `npm run dev`, open `http://localhost:5173`. You should see the Phaser template boot screen. The Phaser chunk will be loaded separately from the app chunk — verify in the Network tab that `phaser-*.js` is a separate file from `index-*.js`.

Run `npm run test:run` — all test files should report 0 failures (no tests yet = 0 failures is correct before TDD begins).
