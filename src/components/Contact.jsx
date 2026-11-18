import { useEffect, useRef, useState } from "react";

const START = 9;

function Contact() {
  const ref = useRef(null);
  const [count, setCount] = useState(START);

  // Arcade continue countdown: counts down while the section is on screen
  // and resets when you leave, like walking back up to the cabinet.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    let timer;
    const io = new IntersectionObserver(
      ([entry]) => {
        clearInterval(timer);
        if (!entry.isIntersecting) {
          setCount(START);
          return;
        }
        timer = setInterval(() => {
          setCount((c) => {
            if (c <= 1) clearInterval(timer);
            return Math.max(0, c - 1);
          });
        }, 1000);
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(timer);
    };
  }, []);

  return (
    <section id="contact" className="section contact" ref={ref} aria-labelledby="contact-title">
      <div className="wrap contact-inner">
        <h2 id="contact-title" className="contact-title">
          Continue?
          <span className="contact-count" aria-hidden="true">
            {count}
          </span>
        </h2>
        <p className="contact-lede">
          Feel free to reach out by email or find me on GitHub.
        </p>
        <div className="contact-links">
          <a href="mailto:yueheng.fu@uwaterloo.ca" className="btn btn-primary">
            Email me
          </a>
          <a href="https://github.com/YuehengFu" className="btn btn-secondary" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
        <p className="contact-email">yueheng.fu@uwaterloo.ca</p>
      </div>
    </section>
  );
}

export default Contact;
