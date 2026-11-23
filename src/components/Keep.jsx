// Keeps hyphenated words ("co-chair", "3D-printed", "head-to-head") on one
// line, so a narrow column never breaks them at the hyphen.
export default function Keep({ children }) {
  if (typeof children !== 'string') return children
  return children.split(/(\S+-\S+)/).map((part, i) =>
    i % 2 ? (
      <span key={i} className="nw">
        {part}
      </span>
    ) : (
      part
    ),
  )
}
