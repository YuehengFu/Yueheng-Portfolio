# yueheng-site

Personal website for Yueheng Fu: a minimal, text-first page with one centrepiece, a low-poly cat (`public/models/meowmeow.obj`, a YH Models original) drawn in the page's own ink and floating behind the text.

Built with Vite, React and three.js (@react-three/fiber).

```sh
npm install
npm run dev        # local dev server
npm run lint
npm run build      # static site in dist/
npm run fallback   # regenerate the no-WebGL drawing after changing the model or pose
```

- `src/content.js`: all the copy.
- `src/components/`: the page sections.
- `src/scene/`: the cat. `layout.js` places it, `CatRig.js` draws and moves it, and `CatStage.jsx` owns the canvas and decides when it renders.
- `src/styles/`: tokens, base and page CSS.

Deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.
