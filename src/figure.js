// Which figure is on the stand: the cat for the top half of the page, crystal
// boy once you scroll past the middle (wide screens; phones only ever see the
// cat, which scrolls away with the intro). CatStage sets it; the footer credit
// and the card read it.
let figure = 'cat'
const listeners = new Set()

export function setFigure(next) {
  if (next === figure) return
  figure = next
  for (const fn of listeners) fn()
}
export function subscribeFigure(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
export function getFigure() {
  return figure
}
