import Keep from './Keep.jsx'

// One entry: a heading line (name · role), a mono figure (right-aligned on
// wide screens, under the name on phones) and a one-line note.
export default function Row({ head, figure, note, figureLabel }) {
  return (
    <li className="row">
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
