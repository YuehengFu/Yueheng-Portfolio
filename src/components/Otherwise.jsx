import Section from './Section.jsx'
import Keep from './Keep.jsx'
import { numbers, toolkit } from '../content.js'

// The old "player stats": a figure on the left, the sentence it belongs to on
// the right, then the toolkit.
export default function Otherwise() {
  return (
    <Section id="otherwise" label="otherwise">
      <ul className="figs">
        {numbers.map((n) => (
          <li key={n.figure}>
            <span className="fig">{n.figure}</span>
            <span>
              <Keep>{n.text}</Keep>
            </span>
          </li>
        ))}
      </ul>
      <dl className="kit">
        {toolkit.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}
