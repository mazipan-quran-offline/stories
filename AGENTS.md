# AGENTS.md

Guidance for AI coding agents working in this repo.

## Project

Static "Web Stories" site for Baca-Quran.id. Pure HTML in `src/`, no JS framework.
The production "build" simply copies HTML files into `dist/`; Parcel is only used
for local development and the optional `build:parcel` pipeline.

## Toolchain

- **Node**: Node 24 LTS. `engines.node` in `package.json` (`^24.16.0`) is
  the source of truth and is what CI's `setup-node` reads via
  `node-version-file: package.json`. `.nvmrc` mirrors the same pin for
  local `nvm use` / `fnm use` convenience — keep the two in sync when
  bumping.
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
| Regenerate landing page from `content.json` | `pnpm run generate:index` |
| Regenerate sitemap from `content.json` | `pnpm run generate:sitemap` |
| Production build (deploy artifact) | `pnpm run build` |
| Parcel build (optimized HTML) | `pnpm run build:parcel` |
| Format | `pnpm run format` |
| Format check (CI gate) | `pnpm run format:check` |
| Lint | `pnpm run lint` |
| Format + lint + autofix | `pnpm run check` |

## Layout

```
content.json              # SINGLE SOURCE OF TRUTH for the story catalog (metadata)
scripts/
  content.mjs             # shared loader: reads content.json, sorts, formats dates
  generate-index.mjs      # regenerates src/index.html (on-demand, NOT in build)
  generate-sitemap.mjs    # regenerates src/sitemap.xml (runs during build)
src/
  index.html              # landing page template; only the card region is injected from content.json
  sitemap.xml             # GENERATED from content.json, do not hand-edit
  <story-slug>/index.html # individual web story (hand-written)
.github/workflows/deploy.yml  # GH Pages deploy
biome.json                # formatter + linter config
pnpm-workspace.yaml       # holds allowBuilds / onlyBuiltDependencies
```

## Content model (`content.json`)

`content.json` is the single source of truth for the catalog. Each entry in
`stories[]` carries the metadata used to build the landing page and sitemap:

| Field | Example | Notes |
| --- | --- | --- |
| `slug` | `tentang-sabar` | Kebab-case; must match the `src/<slug>/` directory. |
| `title` | `Tentang Sabar` | Shown on the card and used in the story `<title>`. |
| `description` | `Kumpulan quote tentang sabar ...` | Card subtitle + meta description. |
| `publishedDate` | `2020-07-02` | ISO `YYYY-MM-DD`. Drives sort order (newest first) and the Indonesian date shown on the card. |
| `gradient` | `linear-gradient(135deg, #ec4899 0%, #ef4444 50%, #fbbf24 100%)` | The card background; match the story page's own gradient. **Always pick gradients from [hypercolor.dev](https://hypercolor.dev/)** (see below). |

The landing page renders cards newest-first; pick `publishedDate` accordingly
(roughly one-week gaps keep the timeline tidy).

### Gradients — always source from hypercolor.dev

Every `gradient` (in `content.json` and the matching `amp-story-page`
background) must come from **[hypercolor.dev](https://hypercolor.dev/)** so the
catalog stays visually consistent. Pick a preset there, copy its Tailwind
`from / via / to` color stops, and express them as a CSS gradient, e.g.
`from-pink-500 via-red-500 to-amber-400` →
`linear-gradient(135deg, #ec4899 0%, #ef4444 50%, #fbbf24 100%)`. Keep the
`135deg` angle for consistency, and remember the verse text sits on a dark
scrim, so any vibrant hypercolor preset keeps white text readable.

## Adding a new story

1. **Add metadata** — append an entry to `stories[]` in `content.json` (slug,
   title, description, `publishedDate`, `gradient` from hypercolor.dev).
2. **Create the page** — add `src/<slug>/index.html` following the structure of
   an existing self-contained story (e.g. `src/tentang-syukur/index.html`):
   - The `amp-story-page` background uses the same hypercolor `gradient` as the
     card in `content.json`.
   - Each ayat lives on its own page: a dark scrim `.panel` containing a kicker,
     the verse wrapped in `<amp-fit-text layout="flex-item" min-font-size="13"
     max-font-size="30">` so long verses auto-scale and never overflow or get
     clipped, and a `.ref` link to the verse on Baca-Quran.id
     (`https://www.baca-quran.id/surah/<surahNumber>/<ayatNumber>/`).
   - Load `amp-fit-text` via
     `<script async custom-element="amp-fit-text" src="https://cdn.ampproject.org/v0/amp-fit-text-0.1.js"></script>`.

   (Older stories such as `src/tentang-sabar/index.html` instead pull full-bleed
   images from `https://www.baca-quran.id/stories-content/<slug>/`; either style
   is valid.)
3. **Sync the landing page** — run `pnpm run generate:index` and commit
   `src/index.html`. This only rewrites the cards between the
   `<!-- stories:start -->` / `<!-- stories:end -->` markers inside
   `<ul class="cards">`; the rest of the page (styles, footer, scripts) is a
   normal hand-edited template. The step is intentionally NOT part of the build,
   so run it locally whenever `content.json` changes.
4. **Verify** — run `pnpm run build` (this regenerates `src/sitemap.xml`) and
   confirm `dist/<slug>/index.html` and the new sitemap entry exist.

> `src/sitemap.xml` is fully generated — don't hand-edit it. In `src/index.html`,
> only the marked card region is generated; the surrounding template is yours to
> edit. Card metadata always comes from `content.json`.

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
