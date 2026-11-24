// The intro: a big name, the school, then one-line highlights, each with its
// org in a tinted chip. Every fact is from the old portfolio or the owner's
// approved resume entries.
const Chip = ({ tint, children }) => <span className={tint ? `chip chip-${tint}` : 'chip'}>{children}</span>

export default function Intro() {
  return (
    <section className="hero" aria-labelledby="hi">
      <h1 id="hi">hi, i&rsquo;m yueheng.</h1>
      <p className="hero-lede">
        first-year <span className="chip">Systems Design Engineering</span> at the{' '}
        <span className="chip">University of Waterloo</span>, in <span className="nw">co-op</span>.
      </p>
      <ul className="highlights">
        <li>
          researching AI safety and alignment as an undergraduate research assistant at the{' '}
          <Chip>Cheriton School of Computer Science</Chip>
        </li>
        <li>
          interning at <Chip tint="violet">Magic Hour AI</Chip> <span className="nw">(YC W24)</span>, applying
          diffusion models
        </li>
        <li>
          founded <Chip tint="amber">YH Models</Chip>, selling <span className="nw">3D-printed</span>{' '}
          <span className="nw">low-poly</span> figurines, the cat included
        </li>
      </ul>
    </section>
  )
}
