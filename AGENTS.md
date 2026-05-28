# AGENTS.md

Guidance for AI coding agents working in this repo.

## Project

Static "Web Stories" site for Baca-Quran.id. Pure HTML in `src/`, no JS framework.
The production "build" simply copies HTML files into `dist/`; Parcel is only used
for local development and the optional `build:parcel` pipeline.

## Toolchain

- **Node**: version pinned in `.nvmrc` (Node 24 LTS). Use `nvm use` (or
  `fnm use`) before running anything.
- **Package manager**: pnpm via Corepack. `packageManager` and `engines` in
  `package.json` are the source of truth — do not switch to npm/yarn.
  Bootstrap with:
  ```sh
  corepack enable
  pnpm install
  ```
- **Bundler**: Parcel 2 (`parcel`, not `parcel-bundler`).
- **Formatter/Linter**: Biome 2 (`biome.json`). HTML files are not formatted
  by Biome yet — leave HTML hand-formatted.

## Commands

| Task | Command |
| --- | --- |
| Install deps | `pnpm install` |
| Dev server | `pnpm run dev` |
| Production build (deploy artifact) | `pnpm run build` |
| Parcel build (optimized HTML) | `pnpm run build:parcel` |
| Format | `pnpm run format` |
| Format check (CI gate) | `pnpm run format:check` |
| Lint | `pnpm run lint` |
| Format + lint + autofix | `pnpm run check` |

## Layout

```
src/
  index.html              # landing page (listed in copy:index)
  sitemap.xml             # copied verbatim
  <story-slug>/index.html # individual web story
.github/workflows/deploy.yml  # GH Pages deploy
biome.json                # formatter + linter config
pnpm-workspace.yaml       # holds allowBuilds / onlyBuiltDependencies
```

## Adding a new story

1. Create `src/<slug>/index.html` following the structure of existing stories
   (e.g. `src/tentang-sabar/index.html`).
2. Add a `<li>` entry on the landing page (`src/index.html`).
3. Add a `<url>` entry in `src/sitemap.xml`.
4. Run `pnpm run build` and verify `dist/<slug>/index.html` exists.

## Conventions

- Tabs for indentation (matches existing files and `biome.json`).
- Keep new dependencies minimal — this project is intentionally
  framework-free.
- Don't reintroduce `yarn.lock` or `package-lock.json`; pnpm is the only
  supported manager.
- Don't add a `"main"` or `"source"` field to `package.json` — Parcel 2
  interprets `"main"` as a target and will fail the HTML build.
- When upgrading native deps (parcel watcher, swc, lmdb, msgpackr-extract,
  biome), update both `allowBuilds` and `onlyBuiltDependencies` in
  `pnpm-workspace.yaml` so install does not warn.

## CI

`.github/workflows/deploy.yml` runs on push to `master`:
1. Checkout, setup Node from `.nvmrc`, enable Corepack.
2. `pnpm install --frozen-lockfile` (so commit lockfile changes alongside
   `package.json` edits).
3. `pnpm run format:check` — must pass; run `pnpm run format` locally if it
   fails.
4. `pnpm run build` → publishes `./dist` to GitHub Pages via
   `peaceiris/actions-gh-pages@v4`.

## Don'ts

- Don't bypass `format:check` with `--no-verify` or by editing the workflow.
- Don't commit `dist/`, `node_modules/`, or `.parcel-cache/`.
- Don't push directly to `master`; open a PR from a feature branch.
