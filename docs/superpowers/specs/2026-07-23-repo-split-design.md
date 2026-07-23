# Repo Split: api / admin / tenant / docs — Design

**Date:** 2026-07-23
**Status:** Approved

## Problem

The frontend currently lives as a single pnpm monorepo (`app/`, repo `officing-node-app`) containing two independent apps — `platform-admin` and `tenant-web` — plus a shared `packages/api-client` package and a `docs/superpowers` folder. Product/API documentation is additionally scattered: duplicated (and drifted) across loose top-level `.md` files and files inside `api/`.

Goal: end up with four fully independent projects/repos — `api`, `admin`, `tenant`, `docs` — each a flat root project (no monorepo nesting), with no cross-repo runtime dependency.

## Scope

This project covers:

- Splitting `app/apps/platform-admin` → new `admin/` repo (flattened to root)
- Splitting `app/apps/tenant-web` → new `tenant/` repo (flattened to root)
- Duplicating `app/packages/api-client` into both new repos as local source (no shared package)
- Consolidating all docs-like content (root loose `.md` files, `api/`'s doc files, `app/docs/superpowers/`) into a new `docs/` repo
- Leaving `api/` as a working repo, minus the doc files that move to `docs/`
- Leaving `app/` in place, untouched, as an inactive reference (not deleted)

Out of scope: creating GitHub repos, pushing anywhere, preserving git history for the split-out apps (fresh `git init` per repo, explicitly chosen over `git subtree`/`filter-repo`), publishing `api-client` as an installable package.

## End-state layout

```text
officing/products/officing/
  api/       (unchanged repo, minus doc files moved to docs/)
  admin/     (NEW repo, fresh git history)
  tenant/    (NEW repo, fresh git history)
  docs/      (NEW repo, fresh git history)
  app/       (left in place, untouched, inactive)
```

## admin/ and tenant/ structure

Each app is flattened from `app/apps/<name>/*` to the repo root:

```text
admin/                          tenant/
  package.json                    package.json
  tsconfig.json                    tsconfig.json
  vite.config.ts                   vite.config.ts
  index.html                       index.html
  .env.example                     .env.example
  .gitignore                       .gitignore
  src/                              src/
    api-client/  (own copy)           api-client/  (own copy)
    ...                               ...
```

- `package.json` `name`: `platform-admin` → `admin`, `tenant-web` → `tenant`. Workspace-only scripts (`dev:admin`, `build:tenant`, etc. from the old root `package.json`) are dropped — each repo just has its own plain `dev`/`build`/`preview`/`typecheck`.
- Fresh `pnpm-lock.yaml` generated per repo via `pnpm install` (not copied from the monorepo lockfile).
- `.gitignore` copied from `app/.gitignore` into each new repo.
- `node_modules/`, `dist/`, `*.tsbuildinfo` are not copied (regenerated).

## Shared api-client handling

`packages/api-client/src/{index,types,tenant,admin,crm}.ts` (~1,241 lines) is copied as-is into `admin/src/api-client/` and `tenant/src/api-client/`. Each copy is independent from that point on — no shared package, no publish/versioning workflow.

To avoid rewriting the 54 existing `@officing/api-client` import lines (8 in admin, 46 in tenant), the import specifier is kept alive via a local alias instead of the pnpm workspace symlink it used before:

```jsonc
// tsconfig.json
"paths": { "@officing/api-client": ["./src/api-client/index.ts"] }
```

```ts
// vite.config.ts
resolve: { alias: { '@officing/api-client': path.resolve(__dirname, 'src/api-client/index.ts') } }
```

## docs/ repo structure

```text
docs/
  api/
    API_DOCUMENTATION.md        <- from api/ (has billing/shipping + tokenId detail root's copy lacked)
    CRM_FEATURE_SPEC.md         <- from root (has resolved decisions; api/'s copy was a stale draft)
    CRM_IMPLEMENTATION.md       <- identical in both source locations, either copy used
    FRONTEND_PROMPT.md          <- identical in both source locations, either copy used
    AUDIT.md
    FUNCTIONAL_AUDIT.md
    MVP_PLAN.md
    NEWPLAN.md
    tracker-update.md
    ops/
      LOCAL_TESTING.md
      ops-restore.md
      ops-runbook.md
      tenant-branches.md
      upgrade-path.md
  specs/
    2026-07-20-crm-module-design.md
  plans/
    2026-07-20-crm-module.md
```

Conflict resolution rule: where the same filename exists in both the repo root and `api/`, the version with the more complete/current content wins (verified by diffing content, not by file mtime — mtimes were found to be unreliable indicators here). The stray duplicate `CRM_FEATURE_SPEC copy.md` at root is dropped entirely.

`README.md` files are **not** moved — each repo (`api/`, `admin/`, `tenant/`, `docs/`) keeps its own README in place.

After copying, the source files are removed from their original locations (root loose `.md` files deleted; moved files removed from `api/`; `app/docs/superpowers/` left as-is since `app/` itself is being left untouched).

## Verification

- `pnpm install && pnpm typecheck` in both `admin/` and `tenant/` to confirm the api-client alias swap resolves correctly and nothing broke in the flatten.
- Spot-check a `dev` build for each to confirm the app still boots.
- Diff-based confirmation that no doc content was lost between old and new locations before deleting originals.

## Explicitly out of scope / deferred to the user

- Creating `officing-node-admin` / `officing-node-tenant` / `officing-node-docs` (or similarly named) repos on GitHub
- Pushing any of the new repos anywhere
- Any decision about deleting `app/` later
