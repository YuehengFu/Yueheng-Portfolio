// The outbound-link mark: a small drawn arrow that nudges up and right on hover.
export default function Arrow() {
  return (
    <svg className="arrow" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
      <path d="M3 7 7 3M3.5 3H7v3.5" fill="none" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  )
}
