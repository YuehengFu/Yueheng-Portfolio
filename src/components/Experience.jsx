import Section from './Section.jsx'
import Row from './Row.jsx'
import Keep from './Keep.jsx'
import { experience } from '../content.js'

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
            figure={e.figure}
            note={e.note}
          />
        ))}
      </ul>
    </Section>
  )
}
