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

const touchOnly = () => window.matchMedia("(hover: none)").matches;

// What the polite live region says for each mode. The hint that used to list
// the controls fades out in play, so the announcement carries them instead.
const statusFor = ({ mode, score }) => {
  if (mode === "play") {
    return touchOnly()
      ? "Game started. 3 lives. Drag to steer, touch and hold to fire, use the Quit button to stop."
      : "Game started. 3 lives. A and D or the arrow keys to move, Space to fire, Escape to quit.";
  }
  if (mode === "over") return `Game over. Final score ${score}.`;
  return "";
};

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
  const startRef = useRef(null);
  const gameRef = useRef(null);
  const visibleRef = useRef(true);
  const focusRef = useRef(true);
  const refocusStartRef = useRef(false);
  const modeRef = useRef("demo");
  const [hud, setHud] = useState(() => ({ mode: "demo", score: 0, hi: readHi(), lives: 3 }));

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancelled = false;

    // A run can end (Esc, or Game over) while a keyboard player has focus on
    // Quit, which unmounts with the mode change. This runs before React
    // re-renders, so park focus on the section now and hand it to Play once
    // the attract screen is back, rather than dropping it on <body>.
    const parkFocus = () => {
      const section = sectionRef.current;
      const active = document.activeElement;
      if (!section || !section.contains(active)) return;
      refocusStartRef.current = true;
      if (active !== section) section.focus({ preventScroll: true });
    };

    const sync = () => {
      const g = gameRef.current;
      if (!g) return;
      if (visibleRef.current && !document.hidden) g.resume();
      else g.pause(); // pause() also drops any held input
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
            if (modeRef.current === "play" && h.mode !== "play") parkFocus();
            modeRef.current = h.mode;
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

    // Alt-tab or a click in the address bar swallows the keyup, so a held
    // key would keep the ship drifting and firing when the player comes back.
    const onBlur = () => gameRef.current?.clearInput();
    window.addEventListener("blur", onBlur);

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
      if (e.code !== "Space" || !focusRef.current) return;
      const active = document.activeElement;
      const free = !active || active === document.body || sectionRef.current.contains(active);
      if (!free) return;
      e.preventDefault();
      // Only a fresh press on the attract screen starts a run: a Space still
      // held from the last one (auto-repeat) must not wipe the final score
      // while "Game over" is showing.
      if (g.mode !== "demo" || e.repeat) return;
      g.play();
      // Space on a focused Play button: same as clicking it, focus moves to
      // the section so it never sits on a button that is fading out.
      if (active === startRef.current) sectionRef.current.focus({ preventScroll: true });
    };

    const onKeyUp = (e) => {
      const g = gameRef.current;
      if (!g) return;
      if (e.code === "ArrowLeft" || e.code === "KeyA") g.input.left = false;
      if (e.code === "ArrowRight" || e.code === "KeyD") g.input.right = false;
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") g.input.fire = false;
      // Firefox activates a focused button on Space keyup; never let the
      // first shot of a run also press whatever button has focus.
      if (e.code === "Space" && g.mode === "play") e.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      cancelled = true;
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      gameRef.current?.destroy();
      gameRef.current = null;
    };
  }, []);

  // When a run ends from the Quit button, Esc with focus in the hero, or Game
  // over, hand focus back to Play (visible again once the mode is demo).
  useEffect(() => {
    if (hud.mode === "demo" && refocusStartRef.current) {
      refocusStartRef.current = false;
      startRef.current?.focus({ preventScroll: true });
    }
  }, [hud.mode]);

  const localX = (e) => e.clientX - e.currentTarget.getBoundingClientRect().left;

  const onPointerMove = (e) => {
    const g = gameRef.current;
    if (g?.mode === "play") g.aimAt(localX(e));
  };

  const onPointerDown = (e) => {
    const g = gameRef.current;
    if (!g || g.mode !== "play" || (e.pointerType === "mouse" && e.button !== 0)) return;
    // Capture keeps the drag steering even when the finger slides over the
    // HUD or off the canvas; it ends by itself on pointerup.
    e.currentTarget.setPointerCapture?.(e.pointerId);
    g.aimAt(localX(e));
    g.input.pointerFire = true;
  };

  const stopFire = () => {
    if (gameRef.current) gameRef.current.input.pointerFire = false;
  };

  const onPointerLeave = (e) => {
    if (!e.currentTarget.hasPointerCapture?.(e.pointerId)) stopFire();
  };

  // A click (not a scroll gesture) starts the game, but only from the attract
  // screen: a tap during "Game over" must not reset the score.
  const onClick = () => {
    const g = gameRef.current;
    if (g?.mode === "demo") g.play();
  };

  const start = (e) => {
    const g = gameRef.current;
    if (!g || g.mode !== "demo") return;
    g.play();
    // Move focus off the (now hidden) Play button onto the section so the
    // first Space keyup can't re-activate a button.
    e.currentTarget.blur();
    sectionRef.current?.focus({ preventScroll: true });
  };

  const quit = () => {
    refocusStartRef.current = true;
    gameRef.current?.quit();
  };

  const playing = hud.mode === "play";

  return (
    <section
      id="hero"
      className="hero"
      ref={sectionRef}
      tabIndex={-1}
      aria-labelledby="hero-title"
    >
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
          onPointerLeave={onPointerLeave}
          onClick={onClick}
        />

        <div className="hud">
          <div className="hud-cell" aria-hidden="true">
            <span className="hud-label">1UP</span>
            <span className="hud-value">{pad(hud.score)}</span>
          </div>
          <div className="hud-cell hud-cell-center" aria-hidden="true">
            <span className="hud-label">HI-SCORE</span>
            <span className="hud-value">{pad(hud.hi)}</span>
          </div>
          <div className="hud-cell hud-cell-end">
            <span className="hud-label" aria-hidden="true">
              LIVES
            </span>
            <span className="hud-lives" aria-hidden="true">
              {Array.from({ length: hud.mode === "demo" ? 3 : hud.lives }, (_, i) => (
                <ShipIcon key={i} />
              ))}
            </span>
            {playing && (
              <button
                type="button"
                className="btn btn-secondary hero-quit"
                onClick={quit}
                aria-keyshortcuts="Escape"
              >
                Quit<span className="quit-key">&nbsp;(Esc)</span>
              </button>
            )}
          </div>
        </div>

        {hud.mode === "over" && (
          <p className="hero-over" aria-hidden="true">
            Game over
          </p>
        )}

        <p className="sr-only" role="status" aria-live="polite">
          {statusFor(hud)}
        </p>

        <div className="hero-copy">
          <h1 id="hero-title" className="sr-only">
            Yueheng Fu
          </h1>
          <p className="hero-tagline">
            First-year Systems Design Engineering student at the University of Waterloo.
          </p>
          <div className="hero-actions">
            <button
              type="button"
              ref={startRef}
              className="btn btn-primary hero-start"
              onClick={start}
            >
              Play
            </button>
            <p className="hero-hint">
              <span className="hint-fine">
                Press <kbd>Space</kbd> to play. Shoot through my name; it grows back.
              </span>
              <span className="hint-touch">Tap the screen to play. Drag to steer.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
