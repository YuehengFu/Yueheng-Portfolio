import { useRef } from "react";
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

function Filmstrip({ org, slides }) {
  const ref = useRef(null);

  const scrollBy = (dir) => {
    const el = ref.current;
    if (!el) return;
    const frames = [...el.children];
    const left = el.scrollLeft;
    // Snap to the neighbouring frame rather than a fixed distance.
    const target =
      dir > 0
        ? frames.find((f) => f.offsetLeft > left + 4)
        : [...frames].reverse().find((f) => f.offsetLeft < left - 4);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: target ? target.offsetLeft : dir > 0 ? el.scrollWidth : 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div className="film">
      <div className="film-track" ref={ref} tabIndex={0} aria-label={`${org} photos and videos`}>
        {slides.map((slide, i) => {
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
                <video src={slide.src} controls preload="metadata" playsInline aria-label={`${org} recap video`} />
              </div>
            );
          }
          return (
            <div className="film-frame film-frame-photo" key={i} style={{ aspectRatio: `${slide.w} / ${slide.h}` }}>
              <img src={slide.src} alt={`${org}, photo ${i + 1}`} loading="lazy" width={slide.w} height={slide.h} />
            </div>
          );
        })}
      </div>
      {slides.length > 1 && (
        <div className="film-controls">
          <button type="button" className="icon-btn" onClick={() => scrollBy(-1)} aria-label={`Previous ${org} photo`}>
            <Arrow flip />
          </button>
          <button type="button" className="icon-btn" onClick={() => scrollBy(1)} aria-label={`Next ${org} photo`}>
            <Arrow />
          </button>
        </div>
      )}
    </div>
  );
}

function Experiences() {
  return (
    <section id="experiences" className="section experiences" aria-labelledby="experiences-title">
      <div className="wrap">
        <TypewriterText as="h2" id="experiences-title" text="Experience" speed={40} />
        <div className="levels">
          {experiences.map((exp) => (
            <article className="level" key={exp.org}>
              <header className="level-info">
                <h3>{exp.org}</h3>
                <p className="level-role">{exp.role}</p>
                <p className="level-subtitle">{exp.subtitle}</p>
                <p className="level-score">{exp.score}</p>
              </header>
              <Filmstrip org={exp.org} slides={exp.slides} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Experiences;
