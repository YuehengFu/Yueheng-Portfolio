// The cat loops for longer than five seconds, so it gets a pause control
// (WCAG 2.2.2). It only shows when the cat actually moves.
export default function Footer({ canPause, paused, onTogglePause }) {
  return (
    <footer className="foot">
      <p className="foot-meta">
        <span>&copy; {new Date().getFullYear()} yueheng fu</span>
        <span>the cat is a yh models original</span>
      </p>
      <p className="foot-actions">
        {canPause && (
          <button type="button" className="text-button" onClick={onTogglePause} aria-pressed={paused}>
            {paused ? 'play the cat' : 'pause the cat'}
          </button>
        )}
        <a href="#top">back to top</a>
      </p>
    </footer>
  )
}
