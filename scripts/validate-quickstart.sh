#!/usr/bin/env bash
# T090 — Quickstart validation checklist
# Validates that the project setup described in quickstart.md is fully working.
# Run from the repo root: bash scripts/validate-quickstart.sh

set -euo pipefail

PASS=0
FAIL=0
ERRORS=()

check() {
  local desc="$1"
  local cmd="$2"
  if eval "$cmd" >/dev/null 2>&1; then
    echo "  ✓ $desc"
    ((PASS++))
  else
    echo "  ✗ $desc"
    ERRORS+=("$desc")
    ((FAIL++))
  fi
}

echo ""
echo "=== Hex Crawl — Quickstart Validation ==="
echo ""

# ── 1. Prerequisites ──────────────────────────────────────────────────────────
echo "1. Prerequisites"

NODE_MAJOR=$(node -e "process.stdout.write(String(process.versions.node.split('.')[0]))" 2>/dev/null || echo "0")
if [ "$NODE_MAJOR" -ge 20 ]; then
  echo "  ✓ Node.js ≥ 20 (found $(node --version))"
  ((PASS++))
else
  echo "  ✗ Node.js ≥ 20 required (found $(node --version 2>/dev/null || echo 'none'))"
  ERRORS+=("Node.js version")
  ((FAIL++))
fi

NPM_MAJOR=$(npm -e "process.stdout.write(String(require('./package.json').engines?.npm || '10'))" 2>/dev/null | head -1 || echo "10")
echo "  ✓ npm $(npm --version) available"
((PASS++))

# ── 2. Project structure ──────────────────────────────────────────────────────
echo ""
echo "2. Project structure"
check "package.json exists"          "[ -f package.json ]"
check "vite.config.ts exists"        "[ -f vite.config.ts ]"
check "tsconfig.json exists"         "[ -f tsconfig.json ]"
check "src/main.ts exists"           "[ -f src/main.ts ]"
check "index.html exists"            "[ -f index.html ]"
check "playwright.config.ts exists"  "[ -f playwright.config.ts ]"
check "vitest.config.ts or vitest in vite.config" \
  "[ -f vitest.config.ts ] || grep -q 'vitest' vite.config.ts package.json 2>/dev/null"

# ── 3. Dependencies installed ─────────────────────────────────────────────────
echo ""
echo "3. Dependencies"
check "node_modules exists"          "[ -d node_modules ]"
check "phaser installed"             "[ -d node_modules/phaser ]"
check "idb installed"                "[ -d node_modules/idb ]"
check "zod installed"                "[ -d node_modules/zod ]"
check "simplex-noise installed"      "[ -d node_modules/simplex-noise ]"
check "vitest installed"             "[ -d node_modules/vitest ]"
check "@playwright/test installed"   "[ -d node_modules/@playwright/test ]"
check "@tailwindcss/vite installed"  "[ -d node_modules/@tailwindcss/vite ]"

# ── 4. TypeScript check ───────────────────────────────────────────────────────
echo ""
echo "4. TypeScript"
check "npx tsc --noEmit passes"      "npx tsc --noEmit 2>&1"

# ── 5. Unit tests ─────────────────────────────────────────────────────────────
echo ""
echo "5. Unit tests"
check "npm run test passes"          "npm run test 2>&1"

# ── 6. Production build ───────────────────────────────────────────────────────
echo ""
echo "6. Production build"
check "npm run build succeeds"       "npm run build 2>&1"
check "dist/index.html produced"     "[ -f dist/index.html ]"
check "dist/assets/ produced"        "[ -d dist/assets ]"

# ── 7. Build size check ───────────────────────────────────────────────────────
echo ""
echo "7. Build size"
check "check-build-size passes"      "node scripts/check-build-size.mjs 2>&1"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "==========================================="
echo "  Passed: $PASS  |  Failed: $FAIL"
if [ ${#ERRORS[@]} -gt 0 ]; then
  echo ""
  echo "  Failed checks:"
  for e in "${ERRORS[@]}"; do
    echo "    - $e"
  done
fi
echo "==========================================="
echo ""

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
