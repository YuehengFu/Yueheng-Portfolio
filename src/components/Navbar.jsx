import { useEffect, useState } from "react";

const LINKS = [
  { id: "projects", label: "Projects" },
  { id: "experiences", label: "Experience" },
  { id: "contact", label: "Contact" },
];

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState("hero");

  // Mark the section that holds the middle of the viewport.
  useEffect(() => {
    const sections = ["hero", ...LINKS.map((l) => l.id)]
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && setActive(e.target.id));
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && setIsOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const close = () => setIsOpen(false);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <a href="#hero" className="logo" onClick={close}>
          Yueheng Fu
        </a>
        <button
          type="button"
          className="nav-toggle"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          aria-controls="nav-links"
          onClick={() => setIsOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav aria-label="Sections">
          <ul id="nav-links" className="nav-links" data-open={isOpen}>
            {LINKS.map((l) => (
              <li key={l.id}>
                <a
                  href={`#${l.id}`}
                  onClick={close}
                  aria-current={active === l.id ? "location" : undefined}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
