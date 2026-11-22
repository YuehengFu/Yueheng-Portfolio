// The intro names the school, the current role and the three older orgs.
// Every fact is from the old portfolio or the owner's approved resume entries.
export default function Intro() {
  return (
    <section className="hero" aria-labelledby="hi">
      <h1 id="hi">hi, i&rsquo;m yueheng.</h1>
      <p>
        i&rsquo;m a first-year <span className="chip">Systems Design Engineering</span> student at the{' '}
        <span className="chip">University of Waterloo</span>, in <span className="nw">co-op</span>. right now i&rsquo;m
        an applied machine learning intern at <span className="chip">Magic Hour AI</span>{' '}<span className="nw">(YC W24)</span>.
      </p>
      <p>
        i founded YH Models, <span className="nw">co-chaired</span> the Markham Teen Arts Council, and was{' '}
        <span className="nw">co-president</span> of one of Ontario&rsquo;s largest DECA chapters.
      </p>
    </section>
  )
}
