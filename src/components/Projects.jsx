import Section from './Section.jsx'
import Row from './Row.jsx'
import Arrow from './Arrow.jsx'
import { projects } from '../content.js'

export default function Projects() {
  return (
    <Section id="projects" label="projects">
      <ul className="rows">
        {projects.map((p) => (
          <Row
            key={p.title}
            head={
              <a className="title-link" href={p.href} target="_blank" rel="noreferrer">
                <span className="org">{p.title}</span>
                <Arrow />
                <span className="sr-only"> (source on GitHub, opens in a new tab)</span>
              </a>
            }
            figure={p.tags}
            figureLabel="built with"
            note={p.note}
          />
        ))}
        <li className="row-quiet">next project · in development. check back soon.</li>
      </ul>
    </Section>
  )
}
