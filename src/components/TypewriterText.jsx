import { useEffect, useRef, useState } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Types `text` out once it scrolls into view. The whole string is in the DOM
// from the first frame: the untyped rest is laid out but transparent, so the
// box never changes size (no layout jump), and search, crawlers and screen
// readers always get the real text. The cursor is absolutely positioned at
// its inline spot, so it takes no width. When typing ends the element gets
// data-drawn, which App.css uses to draw the heading's rule.
function TypewriterText({ text, speed = 8, as: Tag = "span", className, showCursor = true, onDone, ...rest }) {
  const ref = useRef(null);
  const [count, setCount] = useState(() => (prefersReducedMotion() ? text.length : 0));
  const done = count >= text.length;
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (done) onDoneRef.current?.();
  }, [done]);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = ref.current;
    if (!el) return;

    const timeouts = [];
    let started = false;

    const typeChar = (i) => {
      setCount(i);
      if (i < text.length) timeouts.push(setTimeout(() => typeChar(i + 1), speed));
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started) {
            started = true;
            observer.unobserve(el);
            typeChar(0);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      timeouts.forEach(clearTimeout);
    };
  }, [text, speed]);

  return (
    <Tag ref={ref} className={className} data-drawn={done || undefined} {...rest}>
      {done ? (
        <span className="tw">{text}</span>
      ) : (
        <span className="tw">
          {text.slice(0, count)}
          {showCursor && (
            <span className="cursor" aria-hidden="true">
              _
            </span>
          )}
          <span className="tw-rest">{text.slice(count)}</span>
        </span>
      )}
    </Tag>
  );
}

export default TypewriterText;
