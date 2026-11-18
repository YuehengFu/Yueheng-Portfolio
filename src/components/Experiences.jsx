import { useEffect, useRef, useState } from "react";
import TypewriterText from "./TypewriterText";
import TikTokEmbed from "./TikTokEmbed";
import yh1 from "../assets/experiences/yh-1.jpg";
import yh2 from "../assets/experiences/yh-2.jpg";
import mtac2 from "../assets/experiences/mtac-2.jpg";
import mtac3 from "../assets/experiences/mtac-3.jpg";
import mtac4 from "../assets/experiences/mtac-4.jpg";
import mtac5 from "../assets/experiences/mtac-5.jpg";
import mtac6 from "../assets/experiences/mtac-6.jpg";
import mtacRecap from "../assets/experiences/mtac-recap.mp4";
import deca1 from "../assets/experiences/deca-1.jpg";
import deca2 from "../assets/experiences/deca-2.jpg";

const experiences = [
  {
    role: "Founder & Product Designer",
    org: "YH Models",
    subtitle: "Original 3D-printed low-poly figurines, designed and sold online.",
    score: "Received a $3,000 grant from the city",
    slides: [
      {
        type: "tiktok",
        url: "https://www.tiktok.com/@yh.models/video/7416171968195611910",
        videoId: "7416171968195611910",
      },
      { type: "image", src: yh1, w: 900, h: 1200 },
      { type: "image", src: yh2, w: 900, h: 1200 },
    ],
  },
  {
    role: "Co-Chair",
    org: "Markham Teen Arts Council",
    subtitle: "Youth division of the Markham Arts Council. Organized fundraisers and events across York Region.",
    score: "$8,000+ revenue across two years",
    slides: [
      { type: "video", src: mtacRecap, w: 1280, h: 720 },
      { type: "image", src: mtac2, w: 1616, h: 1080 },
      { type: "image", src: mtac3, w: 617, h: 779 },
      { type: "image", src: mtac4, w: 2048, h: 1365 },
      { type: "image", src: mtac5, w: 2048, h: 1365 },
      { type: "image", src: mtac6, w: 2048, h: 1365 },
    ],
  },
  {
    role: "Co-President",
    org: "DECA PETHS Chapter",
    subtitle: "Led one of Ontario's largest DECA chapters, with 200+ members.",
    score: "134 Regional and 106 Provincial awards",
    slides: [
      { type: "image", src: deca1, w: 903, h: 486 },
      { type: "image", src: deca2, w: 1600, h: 1200 },
    ],
  },
];

const CHEVRON = ["X...", "XX..", ".XX.", "..XX", ".XX.", "XX..", "X..."];
const CHEVRON_PATH = CHEVRON.flatMap((row, y) =>
  [...row].map((c, x) => (c === "X" ? `M${x} ${y}h1v1h-1Z` : ""))
).join("");

function Arrow({ flip }) {
  return (
    <svg viewBox="0 0 4 7" aria-hidden="true" shapeRendering="crispEdges" style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <path d={CHEVRON_PATH} fill="currentColor" />
    </svg>
  );
}

function Level({ exp }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ index: 0, atStart: true, atEnd: exp.slides.length < 2 });

  // Track which frame sits at the left edge, and whether either end is reached.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const frames = [...el.children];
      const left = el.scrollLeft;
      let index = 0;
      frames.forEach((f, i) => {
        if (f.offsetLeft - el.offsetLeft <= left + 8) index = i;
      });
      const atEnd = left + el.clientWidth >= el.scrollWidth - 8;
      setPos({ index: atEnd ? frames.length - 1 : index, atStart: left <= 8, atEnd });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const step = (dir) => {
    const el = ref.current;
    if (!el) return;
    const frames = [...el.children];
    const target = frames[Math.max(0, Math.min(frames.length - 1, pos.index + dir))];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: target.offsetLeft - el.offsetLeft, behavior: reduce ? "auto" : "smooth" });
  };

  const total = exp.slides.length;

  return (
    <article className="level">
      <header className="level-info">
        <div>
          <h3>{exp.org}</h3>
          <p className="level-role">{exp.role}</p>
          <p className="level-subtitle">{exp.subtitle}</p>
          <p className="level-score">{exp.score}</p>
        </div>
        {total > 1 && (
          <div className="film-controls">
            <span className="film-count" aria-hidden="true">
              {String(pos.index + 1).padStart(2, "0")}
              <span> / {String(total).padStart(2, "0")}</span>
            </span>
            <button type="button" className="icon-btn" onClick={() => step(-1)} disabled={pos.atStart} aria-label={`Previous ${exp.org} photo`}>
              <Arrow flip />
            </button>
            <button type="button" className="icon-btn" onClick={() => step(1)} disabled={pos.atEnd} aria-label={`Next ${exp.org} photo`}>
              <Arrow />
            </button>
          </div>
        )}
      </header>
      <div className="film-track" ref={ref} tabIndex={0} aria-label={`${exp.org} photos and videos`}>
        {exp.slides.map((slide, i) => {
          if (slide.type === "tiktok") {
            return (
              <div className="film-frame film-frame-tiktok" key={i}>
                <TikTokEmbed videoId={slide.videoId} />
              </div>
            );
          }
          if (slide.type === "video") {
            return (
              <div className="film-frame" key={i} style={{ aspectRatio: `${slide.w} / ${slide.h}` }}>
                <video src={slide.src} controls preload="metadata" playsInline aria-label={`${exp.org} recap video`} />
              </div>
            );
          }
          return (
            <div className="film-frame film-frame-photo" key={i} style={{ aspectRatio: `${slide.w} / ${slide.h}` }}>
              <img src={slide.src} alt={`${exp.org}, photo ${i + 1}`} loading="lazy" width={slide.w} height={slide.h} />
            </div>
          );
        })}
      </div>
    </article>
  );
}

function Experiences() {
  return (
    <section id="experiences" className="section experiences" aria-labelledby="experiences-title">
      <div className="wrap">
        <TypewriterText as="h2" id="experiences-title" text="Experience" speed={40} />
        <div className="levels">
          {experiences.map((exp) => (
            <Level exp={exp} key={exp.org} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Experiences;
