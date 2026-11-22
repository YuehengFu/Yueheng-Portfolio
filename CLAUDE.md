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

Pull content from the old portfolio (`src/components/*.jsx` in `YuehengFu/Yueheng-Portfolio`): intro, experience (YH Models, Markham Teen Arts Council, DECA Peths chapter), projects (Impulse, Ancient Greece Battleground Simulation), contact (yueheng.fu@uwaterloo.ca, GitHub). Possible resume updates (Magic Hour AI, Silver Owl Robotics, MTAC title change, the YH grant source) need the owner's explicit confirmation before they go in.

## Conventions

- **Commits and pushes go under the owner's name only.** Never add a `Co-Authored-By: Claude` trailer or a "Generated with Claude Code" line.
- Commit only when the owner asks, or as part of work they approved. Keep commits small and descriptive, and stage files by explicit path.
- Verify every change with `npm run lint` and `npm run build`. Check visual changes with real screenshots at phone (390px, emulated) and desktop (1440px) widths, in both themes.
- Design skills used by the owner: `impeccable`, `emil-design-eng` and `design-taste-frontend`. Install them into `.claude/skills/` if missing, from pbakaus/impeccable, emilkowalski/skill and Leonxlnx/taste-skill. For 3D work, also use a three.js / React Three Fiber skill (see `docs/design-brief.md`). Never run scripts bundled inside skills that download binaries.

## Status

- 2026-11-21: repo created. Vite + React + three.js scaffold, model files added, placeholder page. **Next:** build the minimal layout and the floating cat scene following the design brief.
