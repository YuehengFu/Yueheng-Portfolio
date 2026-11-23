// The photo peek: hover an experience row that has photos and a small stack
// of prints follows the pointer, lagging a little and swinging with its
// speed. Rows call showPeek/hidePeek; the one <Peek> listens. Mouse only:
// touch and keyboard visitors see the same photos in the scrapbook.
// `last` keeps the photos while the stack fades out.
let state = { list: null, last: null, x: 0, y: 0 }
const listeners = new Set()

export function subscribePeek(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
export function getPeek() {
  return state
}
function emit() {
  for (const fn of listeners) fn(state)
}

export function showPeek(list, e) {
  if (e.pointerType !== 'mouse') return
  state = { list, last: list, x: e.clientX, y: e.clientY }
  emit()
}
export function hidePeek() {
  if (!state.list) return
  state = { ...state, list: null }
  emit()
}
