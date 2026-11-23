import Keep from './Keep.jsx'

// One entry: a heading line (name · role), a mono figure (the dates;
// right-aligned on wide screens, under the name on phones) and a one-line
// note. Extra props (pointer handlers, data attributes) go on the <li>.
export default function Row({ head, figure, note, figureLabel, ...rest }) {
  return (
    <li className="row" {...rest}>
      <p className="row-head">{head}</p>
      {figure && (
        <p className="figure">
          {figureLabel && <span className="sr-only">{figureLabel}: </span>}
          {figure}
        </p>
      )}
      <p className="row-note">
        <Keep>{note}</Keep>
      </p>
    </li>
  )
}
