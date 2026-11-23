import Section from './Section.jsx'
import Row from './Row.jsx'
import Keep from './Keep.jsx'
import { experience } from '../content.js'
import { showPeek, hidePeek } from '../peek.js'

// Every row has the same shape: org · role on the left, dates on the right,
// then the note. Rows with photos show them by the pointer on hover (fine
// pointers only; the same photos are in the scrapbook for everyone else).
export default function Experience() {
  return (
    <Section id="experience" label="experience">
      <ul className="rows">
        {experience.map((e) => (
          <Row
            key={e.org}
            head={
              <>
                <span className="org">{e.org}</span>
                <span className="role">
                  <span aria-hidden="true"> · </span>
                  <span className="sr-only">, </span>
                  <Keep>{e.role}</Keep>
                </span>
              </>
            }
            figure={e.dates}
            figureLabel="dates"
            note={e.note}
            data-peek={e.peek ? '' : undefined}
            onPointerEnter={e.peek ? (ev) => showPeek(e.peek, ev) : undefined}
            onPointerLeave={e.peek ? hidePeek : undefined}
          />
        ))}
      </ul>
    </Section>
  )
}
