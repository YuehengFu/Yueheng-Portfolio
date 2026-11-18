import { useRef, useState } from "react";
import TypewriterText from "./TypewriterText";
import impulseGif from "../assets/impulse.gif";
import vehicleSimGif from "../assets/vehiclesim.gif";

const projectList = [
  {
    title: "Impulse",
    description: "A Java space shooter built from scratch with the Greenfoot library. Artwork handmade in Piskel.",
    image: impulseGif,
    tags: ["Java", "Greenfoot"],
    link: "https://github.com/YuehengFu/Impulse",
  },
  {
    title: "Ancient Greece Battleground Simulation",
    description: "Includes special events with Poseidon, Hades, Zeus & more.",
    image: vehicleSimGif,
    tags: ["Java", "Greenfoot"],
    link: "https://github.com/YuehengFu/YuehengFuVehicleSimulator",
  },
  {
    title: "Next project",
    description: "In development. Check back soon.",
    tags: ["In progress"],
    locked: true,
  },
];

function Projects() {
  const [active, setActive] = useState(0);
  // Bumped only for pointer selection; keyboard selection swaps instantly.
  const [tuneKey, setTuneKey] = useState(0);
  const tabs = useRef([]);
  const project = projectList[active];

  const select = (i, viaPointer) => {
    if (i === active) return;
    setActive(i);
    if (viaPointer) setTuneKey((k) => k + 1);
  };

  const onKeyDown = (e) => {
    const last = projectList.length - 1;
    const next = {
      ArrowDown: active === last ? 0 : active + 1,
      ArrowRight: active === last ? 0 : active + 1,
      ArrowUp: active === 0 ? last : active - 1,
      ArrowLeft: active === 0 ? last : active - 1,
      Home: 0,
      End: last,
    }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    select(next, false);
    tabs.current[next]?.focus();
  };

  return (
    <section id="projects" className="section projects" aria-labelledby="projects-title">
      <div className="wrap">
        <TypewriterText as="h2" id="projects-title" text="Projects" speed={40} />

        <div className="select">
          <div className="select-list" role="tablist" aria-label="Projects" aria-orientation="vertical" onKeyDown={onKeyDown}>
            {projectList.map((p, i) => (
              <button
                key={p.title}
                ref={(el) => (tabs.current[i] = el)}
                type="button"
                role="tab"
                id={`project-tab-${i}`}
                aria-selected={i === active}
                aria-controls="project-panel"
                tabIndex={i === active ? 0 : -1}
                className="select-item"
                data-locked={p.locked || undefined}
                onClick={() => select(i, true)}
              >
                <span className="select-title">{p.title}</span>
                <span className="select-tags">{p.tags.join(" / ")}</span>
              </button>
            ))}
          </div>

          <div
            className="select-panel"
            role="tabpanel"
            id="project-panel"
            aria-labelledby={`project-tab-${active}`}
          >
            <div className="screen" key={tuneKey} data-tune={tuneKey > 0 || undefined}>
              {project.image ? (
                <img src={project.image} alt={`${project.title} gameplay`} className="screen-media" />
              ) : (
                <div className="screen-empty">
                  <span>No signal</span>
                </div>
              )}
            </div>
            <div className="select-info">
              <div>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
              </div>
              {project.link && (
                <a href={project.link} className="btn btn-secondary" target="_blank" rel="noreferrer">
                  View source
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Projects;
