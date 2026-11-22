import Arrow from './Arrow.jsx'
import { CARD_ID } from '../catCard.js'

const TIKTOK = 'https://www.tiktok.com/@yh.models'

// The note beside the cat: where it came from. A small annotation in the
// page's own type, joined to the cat by a leader line, like a callout on a
// drawing. Always in the DOM, right after the footer button that also opens
// it, so keyboard focus moves from the button straight into it.
export default function CatCard({ open, place, instant, cardRef }) {
  const style = place
    ? { left: place.x, top: place.y, '--ox': `${place.ox}px`, '--oy': `${place.oy}px`, '--len': `${place.len ?? 0}px` }
    : undefined
  return (
    <div
      ref={cardRef}
      id={CARD_ID}
      className="cat-card"
      role="group"
      aria-label="about the cat"
      data-open={open || undefined}
      data-side={place?.side}
      data-instant={instant || undefined}
      style={style}
    >
      <p className="cat-card-label">a yh models original</p>
      <p className="cat-card-text">
        designed in Blender and <span className="nw">3D-printed</span> by YH Models, my{' '}
        <span className="nw">3D-printing</span> business, <span className="nw">2024&ndash;2026</span>.
      </p>
      <a className="cat-card-link" href={TIKTOK} target="_blank" rel="noopener noreferrer">
        @yh.models
        <Arrow />
        <span className="sr-only"> on TikTok (opens in a new tab)</span>
      </a>
      <span className="cat-card-leader" aria-hidden="true" />
    </div>
  )
}
