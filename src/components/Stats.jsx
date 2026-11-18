import { useEffect, useRef, useState } from "react";
import TypewriterText from "./TypewriterText";

const SEGMENTS = 32;

const stats = [
  {
    name: "SAT",
    value: 1560,
    max: 1600,
    display: (n) => `${n} / 1600`,
    note: "99th percentile",
    parts: [
      { name: "Math", value: 800, max: 800 },
      { name: "Reading & Writing", value: 760, max: 800 },
    ],
  },
  {
    name: "Fermat Math Contest",
    value: 99,
    max: 100,
    display: (n) => `${n}th percentile`,
    note: "Among 19,000 international competitors",
  },
];

const apExams = ["Calculus BC", "Macroeconomics", "Microeconomics"];

const loadout = [
  { slot: "Languages", items: ["C/C++", "Java", "Python", "JavaScript", "HTML/CSS", "Lua", "SQL"] },
  { slot: "Frameworks", items: ["React", "Node.js"] },
  { slot: "Libraries", items: ["NumPy", "OpenCV", "Pandas"] },
  { slot: "Tools", items: ["Blender", "SolidWorks"] },
];

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Counts from 0 to `to` with a strong ease-out once `run` turns true.
function useCount(to, run, duration = 900) {
  const [n, setN] = useState(() => (reducedMotion() ? to : 0));
  useEffect(() => {
    if (!run || reducedMotion()) return;
    let raf;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      setN(Math.round(to * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, run, duration]);
  return n;
}

function Bar({ value, max, segments = SEGMENTS, small }) {
  const lit = Math.round((value / max) * segments);
  return (
    <div className="bar" data-small={small || undefined} aria-hidden="true">
      {Array.from({ length: segments }, (_, i) => (
        <span key={i} data-lit={i < lit || undefined} style={{ "--i": i }} />
      ))}
    </div>
  );
}

function Stat({ stat, run }) {
  const n = useCount(stat.value, run);
  return (
    <li className="stat">
      <div className="stat-head">
        <h3>{stat.name}</h3>
        <span className="stat-value" aria-label={stat.display(stat.value)}>
          {stat.display(n)}
        </span>
      </div>
      <Bar value={stat.value} max={stat.max} />
      <p className="stat-note">{stat.note}</p>
      {stat.parts && (
        <ul className="stat-parts">
          {stat.parts.map((p) => (
            <li key={p.name}>
              <span>{p.name}</span>
              <Bar value={p.value} max={p.max} segments={16} small />
              <span className="stat-part-value">{p.value}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

const pixelPath = (rows) =>
  rows
    .flatMap((row, y) => [...row].map((c, x) => (c === "X" ? `M${x} ${y}h1v1h-1Z` : "")))
    .join("");

const TROPHY = pixelPath([
  "XXXXXXXXX",
  "X.XXXXX.X",
  "X.XXXXX.X",
  ".XXXXXXX.",
  "..XXXXX..",
  "...XXX...",
  "....X....",
  "...XXX...",
  "..XXXXX..",
]);

function Stats() {
  const ref = useRef(null);
  const [run, setRun] = useState(false);

  useEffect(() => {
    const el = ref.current;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setRun(true);
        io.disconnect();
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      id="stats"
      className="section stats"
      ref={ref}
      data-run={run || undefined}
      aria-labelledby="stats-title"
    >
      <div className="wrap">
        <TypewriterText as="h2" id="stats-title" text="Player stats" speed={40} />

        <div className="stats-grid">
          <aside className="player-card">
            <dl>
              <div>
                <dt>Player</dt>
                <dd>Yueheng Fu</dd>
              </div>
              <div>
                <dt>Class</dt>
                <dd>Systems Design Engineering (Co-op)</dd>
              </div>
              <div>
                <dt>Guild</dt>
                <dd>University of Waterloo</dd>
              </div>
              <div>
                <dt>Joined</dt>
                <dd>Sep. 2026</dd>
              </div>
            </dl>

            <h3 className="loadout-title">Loadout</h3>
            <dl className="loadout">
              {loadout.map((l) => (
                <div key={l.slot}>
                  <dt>{l.slot}</dt>
                  <dd>
                    {l.items.map((item) => (
                      <span key={item} className="chip">
                        {item}
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </aside>

          <div className="stats-main">
            <ul className="stat-list">
              {stats.map((s) => (
                <Stat key={s.name} stat={s} run={run} />
              ))}
            </ul>

            <h3 className="achievements-title">Achievements unlocked</h3>
            <ul className="achievements">
              <li className="achievement achievement-wide" style={{ "--d": 0 }}>
                <svg className="achievement-icon" viewBox="0 0 9 9" aria-hidden="true" shapeRendering="crispEdges">
                  <path d={TROPHY} fill="currentColor" />
                </svg>
                <div>
                  <h4>Lloyd Auckland Math Camp</h4>
                  <p>One of 70 high school students selected nationwide by the University of Waterloo, by invitation for top contest performers.</p>
                </div>
              </li>
              {apExams.map((exam, i) => (
                <li className="achievement" key={exam} style={{ "--d": i + 1 }}>
                  <span className="pips" aria-hidden="true">
                    {Array.from({ length: 5 }, (_, j) => (
                      <span key={j} style={{ "--j": j }} />
                    ))}
                  </span>
                  <div>
                    <h4>AP {exam}</h4>
                    <p>5 / 5, self-studied</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Stats;
