import { useEffect, useRef, useState } from "react";
import { mountGame, SHIP } from "../game/invaders";

const HI_KEY = "yf-hiscore";
const FONT = '"IBM BIOS", "Press Start 2P", monospace';

const readHi = () => {
  try {
    return Number(localStorage.getItem(HI_KEY)) || 0;
  } catch {
    return 0;
  }
};
const writeHi = (hi) => {
  try {
    localStorage.setItem(HI_KEY, String(hi));
  } catch {
    // Storage blocked: the high score just won't persist.
  }
};
const pad = (n) => String(n).padStart(6, "0");

const SHIP_PATH = SHIP.flatMap((row, y) =>
  [...row].map((c, x) => (c === "X" ? `M${x} ${y}h1v1h-1Z` : ""))
).join("");

function ShipIcon() {
  return (
    <svg className="hud-ship" viewBox="0 0 11 6" aria-hidden="true" shapeRendering="crispEdges">
      <path d={SHIP_PATH} fill="currentColor" />
    </svg>
  );
}

function Hero() {
  const canvasRef = useRef(null);
  const crtRef = useRef(null);
  const sectionRef = useRef(null);
  const gameRef = useRef(null);
  const visibleRef = useRef(true);
  const focusRef = useRef(true);
  const [hud, setHud] = useState(() => ({ mode: "demo", score: 0, hi: readHi(), lives: 3 }));

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancelled = false;

    const sync = () => {
      const g = gameRef.current;
      if (!g) return;
      if (visibleRef.current && !document.hidden) g.resume();
      else g.pause();
    };

    document.fonts
      .load(`8px "IBM BIOS"`)
      .catch(() => {})
      .finally(() => {
        if (cancelled || !canvasRef.current) return;
        gameRef.current = mountGame(canvasRef.current, {
          output: crtRef.current,
          reducedMotion,
          fontFamily: FONT,
          hiScore: readHi(),
          onHud: (h) => {
            setHud(h);
            if (h.hi) writeHi(h.hi);
          },
        });
        sync();
      });

    // Pause the loop whenever the hero is off screen or the tab is hidden.
    const io = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.intersectionRatio > 0;
        focusRef.current = entry.intersectionRatio >= 0.6;
        sync();
      },
      { threshold: [0, 0.6] }
    );
    io.observe(sectionRef.current);
    document.addEventListener("visibilitychange", sync);

    const typing = () => {
      const el = document.activeElement;
      return el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
    };

    const onKeyDown = (e) => {
      const g = gameRef.current;
      if (!g || e.metaKey || e.ctrlKey || e.altKey || typing()) return;
      if (g.mode === "play") {
        if (!focusRef.current) return;
        switch (e.code) {
          case "ArrowLeft":
          case "KeyA":
            g.input.left = true;
            break;
          case "ArrowRight":
          case "KeyD":
            g.input.right = true;
            break;
          case "Space":
          case "ArrowUp":
          case "KeyW":
            g.input.fire = true;
            break;
          case "Escape":
            g.quit();
            break;
          default:
            return;
        }
        e.preventDefault();
        return;
      }
      // Space starts a game only while the hero has the screen and nothing
      // else on the page has focus, so it never hijacks normal scrolling.
      const active = document.activeElement;
      const free = !active || active === document.body || sectionRef.current.contains(active);
      if (e.code === "Space" && focusRef.current && free) {
        e.preventDefault();
        g.play();
      }
    };

    const onKeyUp = (e) => {
      const g = gameRef.current;
      if (!g) return;
      if (e.code === "ArrowLeft" || e.code === "KeyA") g.input.left = false;
      if (e.code === "ArrowRight" || e.code === "KeyD") g.input.right = false;
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") g.input.fire = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      cancelled = true;
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      gameRef.current?.destroy();
      gameRef.current = null;
    };
  }, []);

  const localX = (e) => e.clientX - e.currentTarget.getBoundingClientRect().left;

  const onPointerMove = (e) => {
    const g = gameRef.current;
    if (g?.mode === "play") g.aimAt(localX(e));
  };

  const onPointerDown = (e) => {
    const g = gameRef.current;
    if (!g || g.mode !== "play" || (e.pointerType === "mouse" && e.button !== 0)) return;
    g.aimAt(localX(e));
    g.input.pointerFire = true;
  };

  const stopFire = () => {
    if (gameRef.current) gameRef.current.input.pointerFire = false;
  };

  // A click (not a scroll gesture) starts the game.
  const onClick = () => {
    const g = gameRef.current;
    if (g && g.mode !== "play") g.play();
  };

  const toggle = () => {
    const g = gameRef.current;
    if (!g) return;
    if (g.mode === "play") g.quit();
    else g.play();
  };

  const playing = hud.mode === "play";

  return (
    <section id="hero" className="hero" ref={sectionRef} aria-labelledby="hero-title">
      <div className="hero-screen" data-mode={hud.mode}>
        <canvas ref={crtRef} className="hero-crt" aria-hidden="true" />
        <canvas
          ref={canvasRef}
          className="hero-canvas"
          aria-hidden="true"
          onPointerMove={onPointerMove}
          onPointerDown={onPointerDown}
          onPointerUp={stopFire}
          onPointerCancel={stopFire}
          onPointerLeave={stopFire}
          onClick={onClick}
        />

        <div className="hud" aria-hidden="true">
          <div className="hud-cell">
            <span className="hud-label">1UP</span>
            <span className="hud-value">{pad(hud.score)}</span>
          </div>
          <div className="hud-cell hud-cell-center">
            <span className="hud-label">HI-SCORE</span>
            <span className="hud-value">{pad(hud.hi)}</span>
          </div>
          <div className="hud-cell hud-cell-end">
            <span className="hud-label">LIVES</span>
            <span className="hud-lives">
              {Array.from({ length: playing ? hud.lives : 3 }, (_, i) => (
                <ShipIcon key={i} />
              ))}
            </span>
          </div>
        </div>

        {hud.mode === "over" && (
          <p className="hero-over" role="status">
            Game over
          </p>
        )}

        <div className="hero-copy">
          <h1 id="hero-title" className="sr-only">
            Yueheng Fu
          </h1>
          <p className="hero-tagline">
            First-year Systems Design Engineering student at the University of Waterloo.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn btn-primary hero-start" onClick={toggle}>
              {playing ? "Quit game" : "Play"}
            </button>
            <p className="hero-hint">
              {playing ? (
                <>
                  <kbd>A</kbd>
                  <kbd>D</kbd> or arrows to move, <kbd>Space</kbd> to fire, <kbd>Esc</kbd> to quit
                </>
              ) : (
                <>
                  <span className="hint-fine">
                    Press <kbd>Space</kbd> to play. Shoot through my name; it grows back.
                  </span>
                  <span className="hint-touch">Tap the screen to play. Drag to steer.</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
