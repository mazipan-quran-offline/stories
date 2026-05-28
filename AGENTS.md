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
| Validate AMP stories (CI gate) | `pnpm run validate` |

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
     the verse wrapped in `<amp-fit-text layout="flex-item" ...>` so it
     auto-scales to fit and never overflows or gets clipped, and a `.ref` link
     to the verse on Baca-Quran.id
     (`https://www.baca-quran.id/surah/<surahNumber>/<ayatNumber>/`).
   - Load `amp-fit-text` via
     `<script async custom-element="amp-fit-text" src="https://cdn.ampproject.org/v0/amp-fit-text-0.1.js"></script>`.
   - Give it a **cursive content font** and a **themed entrance animation** —
     these are required parts of the house style, see
     [Typography](#typography--cursive-is-the-contents-signature-look) and
     [Motion](#motion--themed-entrance-animations) below.

   (Older stories such as `src/tentang-sabar/index.html` instead pull full-bleed
   images from `https://www.baca-quran.id/stories-content/<slug>/`; either style
   is valid.)

### Font sizing per verse — tune `max-font-size` to verse length

`amp-fit-text` always shrinks text down (to `min-font-size`) to make it fit, so
nothing is ever clipped. But the **`max-font-size` cap is per verse** and should
track how long the ayat is — otherwise a short verse renders awkwardly small
while a long one starts oversized before shrinking. Keep `min-font-size="14"`
and pick the cap by character length:

| Verse length (chars) | `max-font-size` | Example |
| --- | --- | --- |
| ≤ 90 (very short) | `46` | Ar-Rahman 55:1 (<https://www.baca-quran.id/surah/55/1/>), Al-Fatihah 1:1 (<https://www.baca-quran.id/surah/1/1/>) |
| ≤ 180 (medium) | `36` | most ayat |
| ≤ 280 (long) | `28` | multi-clause ayat |
| > 280 (very long) | `24` | e.g. Al-Isra 17:23 |

So a one-line verse can fill the panel at ~46px while a long verse settles
smaller — each page is sized to its own content, not a single fixed value.

### Typography — cursive is the content's signature look

The verse content is meant to feel **cursive/handwritten** — that is the
deliberate house style, carried over from the original 2020 stories (which
used Pacifico + Merienda One). Do **not** ship a gradient story with a plain
serif/sans body; that reads as a regression. Rules:

- **Load fonts per page.** Each story loads only its own fonts via an
  AMP-valid stylesheet `<link>` in `<head>`, placed right after the
  `<link rel="canonical">` (with `preconnect` hints to
  `fonts.googleapis.com` / `fonts.gstatic.com`). Google Fonts is an
  AMP-allowed font provider, so this passes the validator.
- **One pairing per theme:** a *decorative* script for `.cover-title` plus a
  **readable** handwriting/script for `.quote` (the verse body). Set
  `font-family: '<Font>', cursive;` on both.
- **Body readability is non-negotiable.** Verses can be long and sit on a
  dark scrim, so the `.quote` face must stay legible at paragraph length —
  use readable scripts (Merienda, Caveat, Courgette, Kalam). Reserve the
  ornamental faces (Pacifico, Great Vibes, Sacramento, Parisienne, Lobster,
  Kaushan Script, Satisfy) for the short `.cover-title` only. Give `.quote`
  a little more room — `line-height: ~1.6` and `font-weight: 500–600`;
  `.cover-title` reads best at `font-weight: 400`.
- **Default pairing:** Pacifico (title) + Merienda (body). Use it unless the
  theme clearly calls for its own character.
- **Keep UI labels clean.** Don't put the cursive face on `.kicker`, `.ref`,
  or `.brand` — those small labels stay in the system fallback for legibility.

Current per-theme pairings (cover title / verse body):

| Story | Cover title | Verse body |
| --- | --- | --- |
| tentang-syukur | Pacifico | Merienda |
| tentang-tawakal | Satisfy | Caveat |
| tentang-ikhlas | Great Vibes | Courgette |
| tentang-taubat | Parisienne | Kalam |
| tentang-jujur | Kaushan Script | Caveat |
| tentang-berbakti-kepada-orang-tua | Sacramento | Courgette |
| tentang-silaturahmi | Lobster | Merienda |

### Motion — themed entrance animations

AMP web stories animate elements **in** (`animate-in`) as a page becomes
active; the page swipe itself is the "exit" — there is **no per-element exit
animation**, so don't promise one. Give each story a small motion identity:

- **Signature entrance + tempo + easing.** Pick an `animate-in` preset that
  matches the theme's mood and tune `animate-in-duration` /
  `animate-in-timing-function` to set the tempo — calm themes (tawakal)
  breathe slower (~1.2s, `ease-in-out`); direct themes (jujur) snap in
  (~0.6s, `ease-out`).
- **Stagger the cover.** Animate the cover's three children (kicker → title →
  subtitle) with increasing `animate-in-delay` for a layered reveal — animate
  the children, not the wrapping `.panel`.
- **Alternate verse panels.** Use two complementary entrances (A/B) across
  consecutive verse pages so they don't all move identically.
- **Valid presets** (the validator rejects unknown names): `fade-in`,
  `fly-in-{top,bottom,left,right}`, `pan-{up,down,left,right}`, `zoom-in`,
  `zoom-out`, `rotate-in-{left,right}`, `twirl-in`, `whoosh-in-{left,right}`,
  `drop`, `pulse`.

Current per-theme motion (cover / verse A / verse B, tempo):

| Story | Cover | Verse A / B | Tempo |
| --- | --- | --- | --- |
| tentang-syukur | zoom-in | fly-in-bottom / zoom-in | 0.8s ease-out |
| tentang-tawakal | fade-in | pan-up / fade-in | 1.2s ease-in-out |
| tentang-ikhlas | twirl-in | rotate-in-left / rotate-in-right | 1s ease-out |
| tentang-taubat | fly-in-bottom | fly-in-bottom / fade-in | 1s ease-in-out |
| tentang-jujur | whoosh-in-right | whoosh-in-left / whoosh-in-right | 0.6s ease-out |
| tentang-berbakti-kepada-orang-tua | drop | fly-in-bottom / drop | 0.9s ease-out |
| tentang-silaturahmi | fly-in-left | fly-in-left / fly-in-right | 0.9s ease-out |

3. **Sync the landing page** — run `pnpm run generate:index` and commit
   `src/index.html`. This only rewrites the cards between the
   `<!-- stories:start -->` / `<!-- stories:end -->` markers inside
   `<ul class="cards">`; the rest of the page (styles, footer, scripts) is a
   normal hand-edited template. The step is intentionally NOT part of the build,
   so run it locally whenever `content.json` changes.
4. **Validate** — run `pnpm run validate`. Every AMP story must pass the
   official `amphtml-validator`; an invalid document stops the AMP runtime from
   upgrading components like `amp-fit-text`, which silently hides the verse text.
   This is a CI gate, so a failing story will block the deploy.
5. **Verify** — run `pnpm run build` (this regenerates `src/sitemap.xml`) and
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
4. `pnpm run validate` — every AMP story must pass `amphtml-validator`.
5. `pnpm run build` → publishes `./dist` to GitHub Pages.

## Don'ts

- Don't bypass `format:check` with `--no-verify` or by editing the workflow.
- Don't commit `dist/`, `node_modules/`, or `.parcel-cache/`.
- Don't push directly to `master`; open a PR from a feature branch.
