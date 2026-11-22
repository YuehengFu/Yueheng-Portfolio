# yueheng-site

Personal website for Yueheng Fu (first-year Systems Design Engineering, University of Waterloo). It replaces the look of the older arcade-style portfolio (repo `YuehengFu/Yueheng-Portfolio`, live at fuyueheng.com) with a minimalist, text-first page that has one striking element: a floating 3D model of the owner's low-poly cat, `public/models/meowmeow.obj`.

Read `docs/design-brief.md` before any design work. It has the reference-site analysis and the decisions below in more detail.

## Goal and design direction

- **Minimal everywhere except the centrepiece.** A narrow centred column of text (roughly 560–720px), generous whitespace, small text-link navigation, lowercase section labels, at most one accent colour, and almost no imagery. References: justinzwu.com, nelsonsiu.fun, nicholaschen.me, ericzxchen.com.
- **Centrepiece:** `meowmeow.obj` (Blender export, about 287 vertices and 331 faces, one grey material) floats in the background or hero. It should look striking (lighting, material, slow float/rotation, subtle pointer response) without competing with the text. The text must stay readable over it.
- **Theme:** dark by default (near-black, so the object can glow and reflect), with a small light/dark toggle. Respect `prefers-color-scheme` on first visit and remember the choice.
- **Motion:** gentle and purposeful. Honour `prefers-reduced-motion` (a still render or very slow movement). Keep 60fps on a mid-range laptop and degrade gracefully on phones. Pause rendering when the tab is hidden or the canvas is off-screen, and show a static fallback if WebGL is unavailable.

## Stack

- Vite + React 19, plain CSS (no Tailwind unless deliberately chosen).
- three.js with `@react-three/fiber` and `@react-three/drei` (`OBJLoader` via `useLoader`, or drei helpers).
- Deploy target: GitHub Pages via a GitHub Actions workflow (same pattern as the old portfolio's `.github/workflows/deploy.yml`). Custom domain not decided yet; don't take over fuyueheng.com without the owner's say-so.

## Content

All copy lives in `src/content.js` (plus the intro sentences in `src/components/Intro.jsx`). The voice is short and lowercase; the facts are never changed.

- **From the old portfolio** (`src/components/*.jsx` at HEAD of `YuehengFu/Yueheng-Portfolio`), facts kept exactly: experience (YH Models, Markham Teen Arts Council, DECA PETHS Chapter), projects (Impulse, Ancient Greece Battleground Simulation), the stats (SAT, Fermat, Lloyd Auckland Math Camp, AP exams), the toolkit, contact (yueheng.fu@uwaterloo.ca, GitHub).
- **Approved by the owner and included** (facts from the current resume): Magic Hour AI (YC W24), applied machine learning intern, Oct 2026 – present; Silver Owl Robotics Team 2796V, software engineer, May 2024 – May 2025. Each shows as one row with a single one-line fact, not the full resume bullets. Experience is ordered newest first; the three older entries have no dates in the source, so they follow the dated ones in the old portfolio's order.
- **The cat** (`meowmeow.obj`) is an original YH Models design. The footer credits it: "the cat is a yh models original".
- **Still pending owner confirmation, do not change:** the MTAC title (stays "co-chair") and the YH Models grant source (stays "$3,000 grant from the city").
- Don't add any other role, date or number without the owner's say-so.

## Conventions

- **Commits and pushes go under the owner's name only.** Never add a `Co-Authored-By: Claude` trailer or a "Generated with Claude Code" line.
- Commit only when the owner asks, or as part of work they approved. Keep commits small and descriptive, and stage files by explicit path.
- Verify every change with `npm run lint` and `npm run build`. Check visual changes with real screenshots at phone (390px, emulated) and desktop (1440px) widths, in both themes.
## Skills

Load these skills before design or 3D work:

- **three.js skills** (vendored in `.claude/skills/threejs-*`, MIT, from cloudai-x/threejs-skills): use `threejs-react-three-fiber`, `threejs-loaders`, `threejs-materials`, `threejs-lighting`, `threejs-performance` and `threejs-postprocessing` for the centrepiece.
- **Design skills** (`impeccable`, `emil-design-eng`, `design-taste-frontend`): gitignored, so on a fresh clone they're missing. Reinstall them from the sources in `skills-lock.json`, e.g. `npx skills add pbakaus/impeccable`, `npx skills add emilkowalski/skill`, `npx skills add Leonxlnx/taste-skill`, or copy each skill folder into `.claude/skills/`.
- Never run scripts bundled inside skills (impeccable's `scripts/` downloads a binary).

## Status

- 2026-11-21: repo created. Vite + React + three.js scaffold, model files added, placeholder page.
- 2026-11-21: **site built** from the winning "line" prototype, with grafts from the "studio" and "glass" prototypes. Not pushed yet.
  - **Look:** IBM Plex Sans + Mono (self-hosted in `public/fonts`, declared in `index.html`), one ink on one paper, dark by default with a moon/sun toggle (stored choice, else `prefers-color-scheme`). A 544px text column on the left of a 1120px container. Sections: intro, experience, projects, otherwise (figures and toolkit), contact, footer.
  - **The cat** (`src/scene/`): the cat drawn in the page's own ink: 1.2px visible edges, dashed hidden edges, three toon tones with hatching, a halftone dot shadow, and a dashed floor circle on wide screens only. No lights, environment or postprocessing. It draws itself in from the ear tip, rises off its shadow, then sways within a three-quarter range, bobs and leans toward a fine pointer. `layout.js` (`catFrame`) is the one source of truth for where it stands; the CSS mirrors it. Below 1024px it sits in a band above the intro, then leaves and fades as you scroll.
  - **Performance and accessibility:** one fixed canvas, lazy-loaded after the text. dpr is [1, 1.5] and drops to 1 on a slow device. The frameloop is `always` only when the tab is visible, the cat is on screen, it isn't paused and reduced motion is off; otherwise it is `demand` or `never`. Reduced motion shows a still three-quarter pose. A footer "pause the cat" toggle is remembered. There's a skip link, 44px touch targets and a visible focus ring.
  - **Fallback:** without WebGL (or on a scene error) the page shows an inline SVG drawing in the same frame. It's generated by `npm run fallback` (`scripts/make-fallback.mjs`). Re-run it if the model, pose or camera changes.
  - **Deploy:** `.github/workflows/deploy.yml` builds to GitHub Pages on push to `main`. `base: './'`, so it works at https://yuehengfu.github.io/yueheng-site/. Pages must be enabled in the repo settings (Source: GitHub Actions).
  - **Next:** the owner reviews and pushes. Open items: confirm the MTAC title and the YH grant source, decide on a custom domain, and supply dates for the three older entries if they should be ordered strictly by date.
- 2026-11-22: **cat card.** Pointing at the cat (or tapping it on touch) opens a small note beside its head: "a yh models original", one line on YH Models, and a link to @yh.models on TikTok. The footer credit is now a button that opens the same card, for keyboards.
  - **How:** `src/catCard.js` holds the interaction (open delay, close grace, tap detection, Escape, placement) and a small registry. The live cat (`Cat.jsx`: a raycast against a never-rendered, double-sided copy of the faces) and the SVG fallback (`StaticCat.jsx`: point-in-triangle against `tris`, generated by `npm run fallback`) each register a hit test and their on-screen outline. Hit tests run from pointer events only, so they work when the frame loop is on demand or stopped, and never run per frame. The card (`components/CatCard.jsx`) sits right after the footer button in the DOM. It's placed beside the head (never over the text column), else above it, else below the cat, and closes once the cat scrolls away on phones. While it's open or the cat is pointed at, the cat's lines ink a little heavier.
