# Design brief

## What the owner asked for

"Minimalistic, but with a centrepiece in the background: a floating 3D object (meowmeow.obj) that looks really cool, but everything else is minimalistic." Dark theme with a light toggle.

## Reference sites (screenshotted 2026-11-21 at 1440px)

| Site | What it does | Take from it |
|---|---|---|
| justinzwu.com | White page with a huge condensed orange wordmark, a left text nav, and one-line "> shipping @Tesla"-style highlights with coloured chips and hand-drawn underlines. Projects are poster cards below. | One bold identity moment, scannable one-line highlights, inline chips for company names. |
| nelsonsiu.fun | Near-black page with a ~580px centred column in a sans-serif (Inter-like) font. "hi, i'm nelson." then short paragraphs. Small grey lowercase labels (experience, education, publications) and rows with logo, bold org, grey role and right-aligned dates. Moon toggle. | The overall structure and rhythm: grey lowercase labels, entry rows with dates, a theme toggle. |
| nicholaschen.me | Dark grey (#1b1b1b-ish) page set in a serif. Name, three nav links, two short paragraphs with subtle highlighted org names, and a contact link row. Nothing else. | Restraint: the whole page fits in one screen. |
| ericzxchen.com | White page, ~740px column, bold name, "currently:" / "previously:" / "otherwise:" bullet lists with pastel favicon chips per org, [ x ] [ linkedin ] bracket links, footer with a visit counter and a webring. | Lowercase voice, bracketed links, org chips with favicons. |

Common ground: a single narrow column, lots of empty space, a lowercase casual voice, at most one accent colour, a small text nav at the top, and section labels instead of big headings. None of them has a 3D element, so the floating cat is the differentiator.

## Layout direction

- The cat lives in a full-viewport fixed `<canvas>` behind the content (or anchored in the hero area and drifting as you scroll). The content column sits over it with enough contrast. Consider placing the cat off-axis, for example right of the column on desktop, so text never sits on the model's brightest part.
- Top bar: name on the left, a few lowercase links on the right (about / projects / writing or similar), and the theme toggle.
- Sections: intro (2 short lines) → experience rows → projects → contact link row → tiny footer.

## Centrepiece ideas to evaluate

- Material: faceted flat shading suits the low-poly mesh. Options include iridescent/thin-film, glass or transmission with a dark HDRI, matte clay with a rim light, or a wireframe+solid hybrid. Pick one that reads in both themes.
- Motion: slow bob (sine on y), slow yaw, pointer-parallax tilt (eased, small angles), scroll-linked rotation. Respect reduced motion.
- Performance: one canvas, `dpr` capped (~1.5), `frameloop` paused when hidden, the model normalised and centred at load (compute bounding box), and fog or vignette to blend into the background.

## Candidate 3D skills (community, need vetting before install)

- cloudai-x/threejs-skills (modular three.js skills: fundamentals, loaders, materials, lighting, shaders, R3F)
- freshtechbro/claudedesignskills: react-three-fiber, threejs-webgl
- zebbern/claude-code-guide: r3f-best-practices
- MengTo/Skills: threejs ("hero scenes, product spins")
