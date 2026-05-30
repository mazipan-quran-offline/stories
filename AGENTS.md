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
.github/workflows/ci.yml      # PR checks (format, AMP validate, build)
.github/workflows/deploy.yml  # GH Pages deploy on push to master
.github/workflows/scheduled-merge.yml  # promotes date-gated PRs via Kodiak
.kodiak.toml              # Kodiak auto-merge config
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
  `fly-in-{top,bottom,left,right}`, `pan-{up,down,left,right}`,
  `rotate-in-{left,right}`, `twirl-in`, `whoosh-in-{left,right}`,
  `drop`, `pulse`.
- **BANNED: `zoom-in` and `zoom-out` are both strictly forbidden.** Both
  animations cause text to become invisible or scale to an unreadable size in
  our AMP story context. Do not use them on any element, on any page
  (cover, verse, or end-of-story next-story slide).
- **Default when in doubt: `fly-in-left` / `fly-in-right`.** If you are
  unsure which animation to pick, use `fly-in-left` for the cover title and
  alternate `fly-in-left` / `fly-in-right` across verse panels. These are
  reliable, readable, and work at any font size.

Current per-theme motion (cover / verse A / verse B, tempo):

| Story | Cover | Verse A / B | Tempo |
| --- | --- | --- | --- |
| tentang-syukur | fly-in-left | fly-in-bottom / fly-in-right | 0.8s ease-out |
| tentang-tawakal | fade-in | pan-up / fade-in | 1.2s ease-in-out |
| tentang-ikhlas | twirl-in | rotate-in-left / rotate-in-right | 1s ease-out |
| tentang-taubat | fly-in-bottom | fly-in-bottom / fade-in | 1s ease-in-out |
| tentang-jujur | whoosh-in-right | whoosh-in-left / whoosh-in-right | 0.6s ease-out |
| tentang-berbakti-kepada-orang-tua | drop | fly-in-bottom / drop | 0.9s ease-out |
| tentang-silaturahmi | fly-in-left | fly-in-left / fly-in-right | 0.9s ease-out |

### Panel ornaments — decorate the scrim with inline-SVG accents

Gradient stories carry an **ornate vintage-filigree corner ornament** on the
verse `.panel`, drawn entirely in CSS via a `.panel::before` pseudo-element —
**no markup changes**, so it applies to every page of a story at once. Keep
these rules:

- **CSS-only, inline SVG.** The art is four `background-image:
  url("data:image/svg+xml,…")` layers on `.panel::before` — the *same* motif
  placed in each corner, rotated `0/90/180/270` about the viewBox centre
  (`<g transform='rotate(90 36 36)'>…`). Add `position: relative;` to
  `.panel`, and give the pseudo-element
  `content: ""; position: absolute; inset: 6px; pointer-events: none;` with
  `background-repeat: no-repeat`,
  `background-position: top left, top right, bottom right, bottom left`, and
  `background-size: 124px 124px`. Data-URI SVG backgrounds are AMP-valid —
  `pnpm run validate` still passes.
- **Original art only — never embed licensed assets.** Hand-author the SVGs.
  Stock vectors (e.g. Freepik/macrovector) may be used as *visual inspiration*
  only; do not paste their paths or commit their files (licensing +
  attribution strings we don't want in the repo).
- **White at ~half opacity.** Strokes/fills are `#ffffff` at `opacity` ~0.5
  (strokes ~0.55, filled leaves ~0.4, accent dots ~0.6). At that strength it's
  fine for the ornament to overlap the verse text — it reads as a watermark,
  not clutter. URL-encode the SVG (`#` → `%23`, quotes/spaces escaped);
  single-quote all attributes inside.
- **Authoring canvas.** Each motif lives in a `0 0 72 72` viewBox oriented for
  the **top-left** corner, built from: a thin frame line hugging the two
  edges, a flowing scroll/vine with spiral terminals, a few filled
  leaves/petals, and small accent dots. Aim for an intricate look but keep it
  compact (~2–3 KB raw); ×4 rotated copies must leave the whole
  `<style amp-custom>` under AMP's **75 KB** cap (current stories sit ~8–10 KB).
- **The 3 oldest stories stay plain.** `tentang-menuntut-ilmu`,
  `tentang-sabar`, `tentang-sedekah` are full-bleed-image stories with no
  `.panel` scrim — leave them untouched.
- **One distinct motif per story** so the catalog doesn't feel templated;
  don't reuse a neighbour's motif.

#### Placement styles

All three are just different `background-position` / `background-size` sets on
the same `.panel::before`. **Corner** is the current house style; **edge** and
**scatter** are documented below as ready-to-reuse variants (we've used them
before — keep them in the toolbox for future stories or a refresh).

| Placement | Layers | `background-position` | `background-size` |
| --- | --- | --- | --- |
| **corner** | 4 (motif rotated `0/90/180/270` about centre) | `top left, top right, bottom right, bottom left` | `124px 124px` |
| **edge** | 4 (motif rotated `0/90/180/270`, oriented from the top edge inward) | `top center, right center, bottom center, left center` | `104px 104px` |
| **scatter** | 1 (one full-panel SVG of strewn dots/rings) | `center` | `100% 100%` |

Motif catalog (all corner-placed):

| Motif | Look |
| --- | --- |
| `vine` | leafy vine sweeping along both edges with spiral terminals + a bloom |
| `baroque` | symmetric paired C-scrolls ending in spirals |
| `fan` | curved ribs radiating from the corner, each tipped with a leaf |
| `rosette` | framing scrolls with a five-petal bloom nested in the corner |
| `lattice` | interlaced squared scroll with arrow terminals (the one non-floral motif) |
| `beaded` | a scroll trailed by a graduated chain of beads |
| `feather` | long flowing calligraphic ribbons with spiral terminals |

Current per-story ornament:

| Story | Motif |
| --- | --- |
| tentang-tawakal | vine |
| tentang-jujur | baroque |
| tentang-taubat | fan |
| tentang-berbakti-kepada-orang-tua | rosette |
| tentang-silaturahmi | lattice |
| tentang-ikhlas | beaded |
| tentang-syukur | feather |

Example — the four corner layers on `.panel::before` (the first url() is the
raw top-left SVG; the other three are the same SVG wrapped in
`rotate(90|180|270 36 36)`):

```css
.panel { position: relative; }              /* add to the existing rule */
.panel::before {
	content: "";
	position: absolute;
	inset: 6px;
	pointer-events: none;
	/* TL layer, un-rotated (illustrative — real motifs are more detailed):
	   <svg xmlns='http://www.w3.org/2000/svg' width='72' height='72' viewBox='0 0 72 72'>
	     <g fill='none' stroke='#fff' stroke-width='1.4' stroke-linecap='round' opacity='.6'>
	       <path d='M10 10 C19 10 24 16 24 24 C24 30 19 33 15 30 C12 28 13 23 17 24'/>
	       <path d='M22 10 C38 9 50 12 58 22 C61 26 62 30 66 31'/>
	     </g>
	     <path d='M34 10 Q41 4 43 11 Q36 16 34 10 Z' fill='#fff' opacity='.42'/>
	   </svg> */
	background-image: url("data:image/svg+xml,%3Csvg…%3C/svg%3E"), /* TL */
	                  url("data:image/svg+xml,%3Csvg…rotate(90 36 36)…%3C/svg%3E"),  /* TR */
	                  url("data:image/svg+xml,%3Csvg…rotate(180 36 36)…%3C/svg%3E"), /* BR */
	                  url("data:image/svg+xml,%3Csvg…rotate(270 36 36)…%3C/svg%3E"); /* BL */
	background-repeat: no-repeat;
	background-position: top left, top right, bottom right, bottom left;
	background-size: 124px 124px;
}
```

#### Reusable edge & scatter motifs

Kept here so they can be dropped back in without re-deriving them. Same
`.panel::before` rules (white ~0.5 opacity, URL-encoded) — only the
`background-position` / `background-size` change (see the placement table).

**Edge motifs** — authored in a `0 0 48 48` viewBox oriented for the **top
edge** (pointing inward), then rotated `0/90/180/270` about `24 24` for the
top/right/bottom/left layers:

```text
leaf  (botanical petal pointing inward)
  <path d='M24 6 C16 14 16 23 24 30 C32 23 32 14 24 6 Z' fill='#fff' opacity='.12'/>
  <path d='M24 6 C16 14 16 23 24 30' fill='none' stroke='#fff' stroke-width='1.3' stroke-linecap='round' opacity='.5'/>
  <path d='M24 6 C32 14 32 23 24 30' fill='none' stroke='#fff' stroke-width='1.3' stroke-linecap='round' opacity='.5'/>

gem  (diamond flanked by two short dashes)
  <g fill='none' stroke='#fff' stroke-width='1.4' stroke-linecap='round' opacity='.5'>
    <path d='M24 6 L33 15 L24 24 L15 15 Z'/>
    <line x1='6' y1='11' x2='14' y2='11'/><line x1='34' y1='11' x2='42' y2='11'/>
  </g>
  <circle cx='24' cy='15' r='2' fill='#fff' opacity='.55'/>
```

**Scatter** — one full-panel SVG (e.g. `viewBox='0 0 240 420'`) holding ~24
randomly-placed circles, set as a single `background-size: 100% 100%` layer
centred on the panel. Filled circles = `dots`; `fill='none'
stroke='#fff'` = `rings`. Vary radius ~3–8 and `opacity` ~0.18–0.45 for a
gentle confetti texture:

```text
<svg xmlns='http://www.w3.org/2000/svg' width='240' height='420' viewBox='0 0 240 420'>
  <circle cx='38'  cy='52'  r='5'   fill='#fff' opacity='.30'/>
  <circle cx='196' cy='120' r='4'   fill='#fff' opacity='.22'/>
  <circle cx='150' cy='300' r='6'   fill='#fff' opacity='.35'/>
  …(generate the rest with a seeded RNG so the layout is reproducible)…
</svg>
```

To add a new one: hand-author a fresh `0 0 72 72` corner motif (white,
`opacity` ~0.5) distinct from neighbouring stories, URL-encode it, drop the
four rotated copies into the `background-image` slots above, add
`position: relative` to `.panel`, then run `pnpm run validate` and confirm the
`<style amp-custom>` stays under 75 KB.

3. **Add the next-story navigation slide** — every story ends with a
   full-screen slide so tapping anywhere navigates to the next story.
   - Insert `<amp-story-page id="next-story">` as the **last page** of the new
     story, immediately before the `<amp-analytics>` block.
   - For **gradient stories** (current house style): wrap the slide content in
     `<a class="next-story-link" href="…" target="_blank" rel="noopener">` and
     reuse the existing `.page`, `.panel`, `.cover`, `.kicker`, `.cover-title`,
     and `.cover-sub` classes. Add `.next-story-link { display: block; width:
     100%; height: 100%; text-decoration: none; color: inherit; }` to the
     `<style amp-custom>` block.
   - For **older image-based stories** (`tentang-menuntut-ilmu`,
     `tentang-sedekah`, `tentang-sabar`): use `<a class="ns-link">` and add
     `#next-story { background-image: <story-gradient>; }` plus the full
     `.ns-link`, `.ns-page`, `.ns-panel`, `.ns-kicker`, `.ns-title`, `.ns-hint`
     rule set to `<style amp-custom>` — see any of those three files for the
     exact CSS template.
   - **Update the chain.** Stories form a loop in `content.json` order (index 0
     → 1 → … → last → index 0). When inserting a new story at position N:
     1. Find the story currently at position N−1 (the one that will now precede
        the new story).
     2. Update **its** `id="next-story"` slide — change the `href` and the
        displayed title to point to the new story.
     3. Point the **new story's** `id="next-story"` slide at whatever was
        previously the "next" target of the predecessor.
   - Slide content: a `kicker` labelled "Cerita Selanjutnya", an `h2` with the
     next story's title, and a hint "Ketuk untuk melanjutkan ↗", each with
     `animate-in` entrance attributes matching the story's motion style.

4. **Sync the landing page** — run `pnpm run generate:index` and commit
   `src/index.html`. This only rewrites the cards between the
   `<!-- stories:start -->` / `<!-- stories:end -->` markers inside
   `<ul class="cards">`; the rest of the page (styles, footer, scripts) is a
   normal hand-edited template. The step is intentionally NOT part of the build,
   so run it locally whenever `content.json` changes.
5. **Validate** — run `pnpm run validate`. Every AMP story must pass the
   official `amphtml-validator`; an invalid document stops the AMP runtime from
   upgrading components like `amp-fit-text`, which silently hides the verse text.
   This is a CI gate, so a failing story will block the deploy.
6. **Verify** — run `pnpm run build` (this regenerates `src/sitemap.xml`) and
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

**`ci.yml`** — runs on every pull request to `master`:
1. `pnpm run format:check`
2. `pnpm run validate` — every AMP story must pass `amphtml-validator`.
3. `pnpm run build`

**`deploy.yml`** — runs on push to `master` (same steps + deploys `./dist` to GitHub Pages).

**`scheduled-merge.yml`** — cron job (~00:00 WIB every 2 days) that promotes
date-gated PRs; see [Scheduling a story for future publication](#scheduling-a-story-for-future-publication) below.

## Scheduling a story for future publication

To stage a story so it publishes automatically on a future date:

1. **Open a PR normally** (feature branch → `master`) with all changes ready
   to merge. The PR must pass CI.

2. **Embed a publish token in the PR title:**

   ```
   Add story: Tentang Rezeki [publish: 2026-07-01]
   ```

   The token format is `[publish: YYYY-MM-DD]` (case-insensitive, spaces
   around the date are optional).

3. **Do not add the `automerge` label yourself.** The scheduled workflow adds
   it automatically when the date is reached.

4. **Wait.** `scheduled-merge.yml` runs roughly every 2 days (cron can lag).
   When today's date in WIB (UTC+7) is on or after the publish date it will:
   - Strip the `[publish: …]` token from the PR title.
   - Add the `automerge` label.
   - Kodiak (`.kodiak.toml`) then merges the PR once all branch-protection
     checks pass, which triggers the deploy.

5. **Lead time.** Because the cron runs every ~2 days and GitHub cron can lag,
   open the PR at least a few days (ideally 1–2 weeks) before the target date.
   Publishing is date-level, not time-precise.

6. **To cancel scheduling**, close the PR or remove the token from the title
   before the workflow promotes it.

## Don'ts

- **NEVER use `zoom-in` or `zoom-out` as an `animate-in` value** — both cause
  text to become invisible or scale to an unreadable size in our AMP story
  context. This is a hard ban on every page of every story (cover, verse pages,
  next-story slide). When in doubt, use `fly-in-left` / `fly-in-right`.
- Don't bypass `format:check` with `--no-verify` or by editing the workflow.
- Don't commit `dist/`, `node_modules/`, or `.parcel-cache/`.
- Don't push directly to `master`; open a PR from a feature branch.
