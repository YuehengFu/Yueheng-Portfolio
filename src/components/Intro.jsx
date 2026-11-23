// The intro: a big name, the school, then one-line highlights, each with its
// org in a tinted chip. Every fact is from the old portfolio or the owner's
// approved resume entries.
const Chip = ({ tint, children }) => <span className={`chip chip-${tint}`}>{children}</span>

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
          interning at <Chip tint="violet">Magic Hour AI</Chip> <span className="nw">(YC W24)</span>, building an
          outpainting tool
        </li>
        <li>
          co-president of one of Ontario&rsquo;s largest <Chip tint="sky">DECA</Chip> chapters
        </li>
        <li>
          <span className="nw">co-chaired</span> the <Chip tint="rose">Markham Teen Arts Council</Chip>
        </li>
        <li>
          founded <Chip tint="amber">YH Models</Chip>, selling <span className="nw">3D-printed</span>{' '}
          <span className="nw">low-poly</span> figurines, the cat included
        </li>
        <li>
          wrote C++ for the robots at <Chip tint="mint">Silver Owl Robotics</Chip>
        </li>
      </ul>
    </section>
  )
}
