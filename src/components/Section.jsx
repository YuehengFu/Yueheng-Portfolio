// A lowercase label and its content; the label names the section for
// assistive tech too.
export default function Section({ id, label, children }) {
  return (
    <section id={id} aria-labelledby={`${id}-label`}>
      <h2 id={`${id}-label`}>{label}</h2>
      {children}
    </section>
  )
}
