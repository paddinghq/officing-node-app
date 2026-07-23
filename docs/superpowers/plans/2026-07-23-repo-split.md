# Repo Split: api / admin / tenant / docs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the `app/` pnpm monorepo into two independent, flat-root repos (`admin/`, `tenant/`), and consolidate all docs-like content scattered across the root, `api/`, and `app/` into a new `docs/` repo — ending with four sibling projects: `api/`, `admin/`, `tenant/`, `docs/`.

**Architecture:** Pure filesystem restructuring, no application logic changes. Each new repo gets a fresh `git init` (no history carried over, per approved spec). `admin/` and `tenant/` each get their own copy of the previously-shared `api-client` source, kept resolvable under the same `@officing/api-client` import specifier via a tsconfig path + Vite alias so none of the 54 existing import lines need editing.

**Tech Stack:** pnpm, Vite, TypeScript, React 19. No new dependencies.

## Global Constraints

- No GitHub repos are created and nothing is pushed anywhere (local-only, per spec).
- No git history is preserved for `admin/` or `tenant/` — fresh `git init` each (per spec, explicitly chosen over `git subtree`/`filter-repo`).
- `app/` is left in place, fully untouched — it is not deleted, and nothing is removed from it.
- `api/README.md` (and each new repo's own README) stays in place — READMEs are never moved into `docs/`.
- Where the same doc filename exists in both repo-root and `api/`, the version with the more complete/current content wins — verified by reading content, not by mtime (see spec: mtimes were unreliable here).
- Do not delete any original file (root loose `.md`s, `api/`'s doc files) until its copy in the new location has been diff-verified.

---

### Task 1: Scaffold the `docs/` repo

**Files:**
- Create: `officing/products/officing/docs/README.md`
- Create: `officing/products/officing/docs/api/API_DOCUMENTATION.md` (copy of `api/API_DOCUMENTATION.md`)
- Create: `officing/products/officing/docs/api/CRM_FEATURE_SPEC.md` (copy of root `CRM_FEATURE_SPEC.md`, NOT `api/CRM_FEATURE_SPEC.md` — root's has the resolved decisions, api's is a stale draft)
- Create: `officing/products/officing/docs/api/CRM_IMPLEMENTATION.md` (copy of `api/CRM_IMPLEMENTATION.md`)
- Create: `officing/products/officing/docs/api/FRONTEND_PROMPT.md` (copy of `api/FRONTEND_PROMPT.md`)
- Create: `officing/products/officing/docs/api/AUDIT.md`, `FUNCTIONAL_AUDIT.md`, `MVP_PLAN.md`, `NEWPLAN.md`, `tracker-update.md` (copies of the same-named files in `api/`)
- Create: `officing/products/officing/docs/api/ops/LOCAL_TESTING.md`, `ops-restore.md`, `ops-runbook.md`, `tenant-branches.md`, `upgrade-path.md` (copies of `api/docs/*.md`)
- Create: `officing/products/officing/docs/specs/*` and `officing/products/officing/docs/plans/*` (copies of everything currently under `app/docs/superpowers/specs/` and `app/docs/superpowers/plans/`)
- Create: `officing/products/officing/docs/.gitignore`

**Interfaces:** None — this task produces static markdown files only. No later task reads from `docs/`.

- [ ] **Step 1: Create the directory skeleton**

```bash
cd /Users/Dominion/Sites/padding/products/officing
mkdir -p docs/api/ops docs/specs docs/plans
```

- [ ] **Step 2: Copy the api-sourced docs (api/ wins)**

```bash
cd /Users/Dominion/Sites/padding/products/officing
cp api/API_DOCUMENTATION.md docs/api/API_DOCUMENTATION.md
cp api/CRM_IMPLEMENTATION.md docs/api/CRM_IMPLEMENTATION.md
cp api/FRONTEND_PROMPT.md docs/api/FRONTEND_PROMPT.md
cp api/AUDIT.md docs/api/AUDIT.md
cp api/FUNCTIONAL_AUDIT.md docs/api/FUNCTIONAL_AUDIT.md
cp api/MVP_PLAN.md docs/api/MVP_PLAN.md
cp api/NEWPLAN.md docs/api/NEWPLAN.md
cp api/tracker-update.md docs/api/tracker-update.md
cp api/docs/LOCAL_TESTING.md docs/api/ops/LOCAL_TESTING.md
cp api/docs/ops-restore.md docs/api/ops/ops-restore.md
cp api/docs/ops-runbook.md docs/api/ops/ops-runbook.md
cp api/docs/tenant-branches.md docs/api/ops/tenant-branches.md
cp api/docs/upgrade-path.md docs/api/ops/upgrade-path.md
```

- [ ] **Step 3: Copy the root-sourced doc (root wins for this one file)**

```bash
cd /Users/Dominion/Sites/padding/products/officing
cp CRM_FEATURE_SPEC.md docs/api/CRM_FEATURE_SPEC.md
```

- [ ] **Step 4: Copy the superpowers specs/plans wholesale**

```bash
cd /Users/Dominion/Sites/padding/products/officing
cp -R app/docs/superpowers/specs/. docs/specs/
cp -R app/docs/superpowers/plans/. docs/plans/
```

- [ ] **Step 5: Verify every copy matches its source byte-for-byte**

```bash
cd /Users/Dominion/Sites/padding/products/officing
diff api/API_DOCUMENTATION.md docs/api/API_DOCUMENTATION.md
diff api/CRM_IMPLEMENTATION.md docs/api/CRM_IMPLEMENTATION.md
diff api/FRONTEND_PROMPT.md docs/api/FRONTEND_PROMPT.md
diff api/AUDIT.md docs/api/AUDIT.md
diff api/FUNCTIONAL_AUDIT.md docs/api/FUNCTIONAL_AUDIT.md
diff api/MVP_PLAN.md docs/api/MVP_PLAN.md
diff api/NEWPLAN.md docs/api/NEWPLAN.md
diff api/tracker-update.md docs/api/tracker-update.md
diff api/docs/LOCAL_TESTING.md docs/api/ops/LOCAL_TESTING.md
diff api/docs/ops-restore.md docs/api/ops/ops-restore.md
diff api/docs/ops-runbook.md docs/api/ops/ops-runbook.md
diff api/docs/tenant-branches.md docs/api/ops/tenant-branches.md
diff api/docs/upgrade-path.md docs/api/ops/upgrade-path.md
diff CRM_FEATURE_SPEC.md docs/api/CRM_FEATURE_SPEC.md
diff -r app/docs/superpowers/specs docs/specs
diff -r app/docs/superpowers/plans docs/plans
```

Expected: every `diff` prints nothing (no output = files identical). If any diff shows output, stop and re-copy that file before continuing — do not proceed to Task 4's deletions with an unverified copy.

- [ ] **Step 6: Write `docs/README.md`**

```markdown
# Officing Docs

Consolidated product, API, ops, and planning documentation for Officing, split out from `api/` and `app/`.

- `api/` — product & API documentation (feature specs, audits, plans) and ops runbooks (`api/ops/`)
- `specs/` — design specs from prior planning work
- `plans/` — implementation plans from prior planning work
```

- [ ] **Step 7: Add `.gitignore` and initialize the repo**

```bash
cd /Users/Dominion/Sites/padding/products/officing/docs
printf '.DS_Store\n' > .gitignore
git init
git add -A
git commit -m "Initial commit: consolidated docs from api/, app/, and root"
```

Expected: `git log --oneline` shows one commit; `git status` is clean.

---

### Task 2: Scaffold the `admin/` repo

**Files:**
- Create: `officing/products/officing/admin/` — flattened copy of `app/apps/platform-admin/*`
- Create: `officing/products/officing/admin/src/api-client/{index,types,tenant,admin,crm}.ts` (copy of `app/packages/api-client/src/*`)
- Modify: `officing/products/officing/admin/tsconfig.json` (path alias target)
- Modify: `officing/products/officing/admin/vite.config.ts` (resolve alias)
- Modify: `officing/products/officing/admin/package.json` (`name` field)

**Interfaces:** None — `admin/` has no dependents in this plan.

- [ ] **Step 1: Copy the app, excluding generated artifacts**

```bash
cd /Users/Dominion/Sites/padding/products/officing
mkdir -p admin
rsync -a --exclude node_modules --exclude dist --exclude '*.tsbuildinfo' app/apps/platform-admin/ admin/
```

- [ ] **Step 2: Copy the api-client source into place**

```bash
cd /Users/Dominion/Sites/padding/products/officing
mkdir -p admin/src/api-client
cp app/packages/api-client/src/index.ts admin/src/api-client/index.ts
cp app/packages/api-client/src/types.ts admin/src/api-client/types.ts
cp app/packages/api-client/src/tenant.ts admin/src/api-client/tenant.ts
cp app/packages/api-client/src/admin.ts admin/src/api-client/admin.ts
cp app/packages/api-client/src/crm.ts admin/src/api-client/crm.ts
```

- [ ] **Step 3: Point the tsconfig path alias at the local copy**

In `admin/tsconfig.json`, change:

```json
"paths": {
  "@officing/api-client": ["../../packages/api-client/src/index.ts"]
}
```

to:

```json
"paths": {
  "@officing/api-client": ["./src/api-client/index.ts"]
}
```

- [ ] **Step 4: Add a Vite resolve alias so the build (not just the type-checker) finds it**

Replace the full contents of `admin/vite.config.ts` with:

```ts
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 3000 },
  resolve: {
    alias: {
      '@officing/api-client': path.resolve(__dirname, 'src/api-client/index.ts'),
    },
  },
});
```

- [ ] **Step 5: Rename the package and drop workspace-only config**

In `admin/package.json`, change `"name": "platform-admin"` to `"name": "admin"`. Remove the `"@officing/api-client": "workspace:*"` line from `"dependencies"` (it's now local source, not a package dependency).

- [ ] **Step 6: Add `.gitignore`**

```bash
cd /Users/Dominion/Sites/padding/products/officing
cp app/.gitignore admin/.gitignore
```

- [ ] **Step 7: Install and typecheck**

```bash
cd /Users/Dominion/Sites/padding/products/officing/admin
pnpm install
pnpm typecheck
```

Expected: `pnpm install` completes without error and generates `admin/pnpm-lock.yaml`; `pnpm typecheck` reports no errors.

- [ ] **Step 8: Boot the dev server as a smoke test**

```bash
cd /Users/Dominion/Sites/padding/products/officing/admin
timeout 15 pnpm dev || true
```

Expected: Vite prints a local dev URL (e.g. `Local: http://localhost:3000/`) before the timeout kills it — confirms the app boots without a module-resolution error on `@officing/api-client`.

- [ ] **Step 9: Initialize the repo and commit**

```bash
cd /Users/Dominion/Sites/padding/products/officing/admin
git init
git add -A
git commit -m "Initial commit: platform-admin split out of officing-node-app monorepo"
```

Expected: `git log --oneline` shows one commit; `git status` is clean.

---

### Task 3: Scaffold the `tenant/` repo

**Files:**
- Create: `officing/products/officing/tenant/` — flattened copy of `app/apps/tenant-web/*`
- Create: `officing/products/officing/tenant/src/api-client/{index,types,tenant,admin,crm}.ts` (copy of `app/packages/api-client/src/*`)
- Modify: `officing/products/officing/tenant/tsconfig.json` (path alias target)
- Modify: `officing/products/officing/tenant/vite.config.ts` (resolve alias)
- Modify: `officing/products/officing/tenant/package.json` (`name` field)

**Interfaces:** None — `tenant/` has no dependents in this plan.

- [ ] **Step 1: Copy the app, excluding generated artifacts**

```bash
cd /Users/Dominion/Sites/padding/products/officing
mkdir -p tenant
rsync -a --exclude node_modules --exclude dist --exclude '*.tsbuildinfo' app/apps/tenant-web/ tenant/
```

- [ ] **Step 2: Copy the api-client source into place**

```bash
cd /Users/Dominion/Sites/padding/products/officing
mkdir -p tenant/src/api-client
cp app/packages/api-client/src/index.ts tenant/src/api-client/index.ts
cp app/packages/api-client/src/types.ts tenant/src/api-client/types.ts
cp app/packages/api-client/src/tenant.ts tenant/src/api-client/tenant.ts
cp app/packages/api-client/src/admin.ts tenant/src/api-client/admin.ts
cp app/packages/api-client/src/crm.ts tenant/src/api-client/crm.ts
```

- [ ] **Step 3: Point the tsconfig path alias at the local copy**

In `tenant/tsconfig.json`, change:

```json
"paths": {
  "@officing/api-client": ["../../packages/api-client/src/index.ts"]
}
```

to:

```json
"paths": {
  "@officing/api-client": ["./src/api-client/index.ts"]
}
```

- [ ] **Step 4: Add a Vite resolve alias**

Replace the full contents of `tenant/vite.config.ts` with:

```ts
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@officing/api-client': path.resolve(__dirname, 'src/api-client/index.ts'),
    },
  },
});
```

- [ ] **Step 5: Rename the package and drop workspace-only config**

In `tenant/package.json`, change `"name": "tenant-web"` to `"name": "tenant"`. Remove the `"@officing/api-client": "workspace:*"` line from `"dependencies"`.

- [ ] **Step 6: Add `.gitignore`**

```bash
cd /Users/Dominion/Sites/padding/products/officing
cp app/.gitignore tenant/.gitignore
```

- [ ] **Step 7: Install and typecheck**

```bash
cd /Users/Dominion/Sites/padding/products/officing/tenant
pnpm install
pnpm typecheck
```

Expected: `pnpm install` completes without error and generates `tenant/pnpm-lock.yaml`; `pnpm typecheck` reports no errors.

- [ ] **Step 8: Boot the dev server as a smoke test**

```bash
cd /Users/Dominion/Sites/padding/products/officing/tenant
timeout 15 pnpm dev || true
```

Expected: Vite prints a local dev URL before the timeout kills it.

- [ ] **Step 9: Initialize the repo and commit**

```bash
cd /Users/Dominion/Sites/padding/products/officing/tenant
git init
git add -A
git commit -m "Initial commit: tenant-web split out of officing-node-app monorepo"
```

Expected: `git log --oneline` shows one commit; `git status` is clean.

---

### Task 4: Remove the now-consolidated docs from their original locations

**Files:**
- Delete (no git, plain directory): `officing/products/officing/API_DOCUMENTATION.md`, `CRM_FEATURE_SPEC.md`, `"CRM_FEATURE_SPEC copy.md"`, `CRM_IMPLEMENTATION.md`, `FRONTEND_PROMPT.md`
- Delete (git repo `api/`): `api/API_DOCUMENTATION.md`, `api/AUDIT.md`, `api/CRM_FEATURE_SPEC.md`, `api/CRM_IMPLEMENTATION.md`, `api/FRONTEND_PROMPT.md`, `api/FUNCTIONAL_AUDIT.md`, `api/MVP_PLAN.md`, `api/NEWPLAN.md`, `api/tracker-update.md`, `api/docs/LOCAL_TESTING.md`, `api/docs/ops-restore.md`, `api/docs/ops-runbook.md`, `api/docs/tenant-branches.md`, `api/docs/upgrade-path.md`

**Interfaces:** None. This is a pure deletion task and only runs after Task 1 Step 5 has verified every copy.

**Precondition check** — do not start this task unless Task 1 Step 5's diffs all produced no output. If you're picking this task up independently, re-run those diffs first.

- [ ] **Step 1: Re-verify copies exist and match before deleting anything**

```bash
cd /Users/Dominion/Sites/padding/products/officing
for f in API_DOCUMENTATION.md CRM_IMPLEMENTATION.md FRONTEND_PROMPT.md; do
  diff "api/$f" "docs/api/$f" || { echo "MISMATCH: $f — STOP"; exit 1; }
done
diff CRM_FEATURE_SPEC.md docs/api/CRM_FEATURE_SPEC.md || { echo "MISMATCH: CRM_FEATURE_SPEC.md — STOP"; exit 1; }
echo "All verified matching."
```

Expected: `All verified matching.` printed, no `MISMATCH` lines.

- [ ] **Step 2: Delete the root loose doc files (root is not a git repo — plain rm)**

```bash
cd /Users/Dominion/Sites/padding/products/officing
rm "API_DOCUMENTATION.md" "CRM_FEATURE_SPEC.md" "CRM_FEATURE_SPEC copy.md" "CRM_IMPLEMENTATION.md" "FRONTEND_PROMPT.md"
```

Expected: `ls *.md` in this directory now returns no matches (or "no matches found").

- [ ] **Step 3: Remove the moved doc files from `api/` via git**

```bash
cd /Users/Dominion/Sites/padding/products/officing/api
git rm API_DOCUMENTATION.md AUDIT.md CRM_FEATURE_SPEC.md CRM_IMPLEMENTATION.md FRONTEND_PROMPT.md FUNCTIONAL_AUDIT.md MVP_PLAN.md NEWPLAN.md tracker-update.md
git rm docs/LOCAL_TESTING.md docs/ops-restore.md docs/ops-runbook.md docs/tenant-branches.md docs/upgrade-path.md
```

- [ ] **Step 4: Confirm `api/docs/` is now empty and remove it**

```bash
cd /Users/Dominion/Sites/padding/products/officing/api
ls docs/ 2>/dev/null
rmdir docs 2>/dev/null || true
```

Expected: `ls docs/` shows nothing (directory empty or already gone).

- [ ] **Step 5: Commit the removal in `api/`**

```bash
cd /Users/Dominion/Sites/padding/products/officing/api
git status
git commit -m "Move product/API docs and ops runbooks to the docs/ repo"
```

Expected: commit succeeds; `git status` clean; `README.md` still present (`ls README.md`).

---

## Self-Review Notes

- **Spec coverage:** End-state layout (Tasks 1-4 collectively produce it), api-client duplication + alias mechanism (Task 2 Steps 2-4, Task 3 Steps 2-4), docs consolidation with content-based conflict resolution (Task 1), cleanup of originals (Task 4), verification via typecheck/dev-boot/diff (Task 1 Step 5, Task 2 Steps 7-8, Task 3 Steps 7-8, Task 4 Step 1) — all covered. `app/` is untouched throughout (only read from, never written to or deleted).
- **No placeholders:** every step has literal file paths and full command/code blocks.
- **Type/name consistency:** `@officing/api-client` alias target (`./src/api-client/index.ts`) matches the actual copy destination in both Task 2 and Task 3; `package.json` name changes (`admin`, `tenant`) are consistent with the directory names used throughout.
