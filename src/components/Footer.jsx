import CatCard from './CatCard.jsx'
import { CARD_ID } from '../catCard.js'

// The cat loops for longer than five seconds, so it gets a pause control
// (WCAG 2.2.2). It only shows when the cat actually moves. The credit opens
// the same card as pointing at the cat, so a keyboard reaches it too.
export default function Footer({ canPause, paused, onTogglePause, card, cardRef, creditRef }) {
  return (
    <footer className="foot">
      <p className="foot-meta">
        <span>&copy; {new Date().getFullYear()} yueheng fu</span>
        <button
          ref={creditRef}
          type="button"
          className="text-button credit"
          onClick={card.toggle}
          aria-expanded={card.open}
          aria-controls={CARD_ID}
        >
          the cat is a yh models original
        </button>
      </p>
      <CatCard open={card.open} place={card.place} instant={card.instant} cardRef={cardRef} />
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
