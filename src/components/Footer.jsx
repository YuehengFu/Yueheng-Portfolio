import { useSyncExternalStore } from 'react'
import CatCard from './CatCard.jsx'
import { getFigure, subscribeFigure } from '../figure.js'
import { CARD_ID } from '../catCard.js'

// The cat loops for longer than five seconds, so it gets a pause control
// (WCAG 2.2.2). It only shows when the cat actually moves. The credit opens
// the same card as pointing at the cat, so a keyboard reaches it too.
export default function Footer({ canPause, paused, onTogglePause, card, cardRef, creditRef }) {
  const figure = useSyncExternalStore(subscribeFigure, getFigure)
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
          {figure === 'cat' ? 'the cat is a yh models original' : 'crystal boy is a yh models original'}
        </button>
      </p>
      <CatCard figure={figure} open={card.open} place={card.place} instant={card.instant} cardRef={cardRef} />
      <p className="foot-actions">
        {canPause && (
          <button type="button" className="text-button" onClick={onTogglePause} aria-pressed={paused}>
            {paused ? 'play' : 'pause'} {figure === 'cat' ? 'the cat' : 'crystal boy'}
          </button>
        )}
        <a href="#top">back to top</a>
      </p>
    </footer>
  )
}
