import { useEffect, useMemo } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { CatLoader } from './CatLoader.js'
import { CatRig } from './CatRig.js'
import { FADED } from './layout.js'
import { provideCat } from '../catCard.js'

const MODEL_URL = `${import.meta.env.BASE_URL}models/meowmeow.obj`

// The cat inside the Canvas. All motion lives in CatRig and runs through refs;
// React only re-renders this when the viewport or the mode changes.
export default function Cat({ inputRef, colorsRef, mode, onReady }) {
  const object = useLoader(CatLoader, MODEL_URL)
  const rig = useMemo(() => new CatRig(object), [object])
  const camera = useThree((s) => s.camera)
  const width = useThree((s) => s.size.width)
  const height = useThree((s) => s.size.height)
  const invalidate = useThree((s) => s.invalidate)
  const canvas = useThree((s) => s.gl.domElement)

  useEffect(() => () => rig.dispose(), [rig])
  useEffect(() => onReady(), [onReady])
  useEffect(() => {
    rig.frame(camera, width, height)
    invalidate()
  }, [rig, camera, width, height, invalidate])

  // The cat card asks this cat where it is (see catCard.js). Viewport points
  // map to canvas points through the canvas's box, and on phones the camera's
  // scroll offset is brought up to date first, as the next frame would.
  useEffect(() => {
    const input = inputRef.current
    const shown = () => input.wide || window.scrollY < FADED // phones: until it has faded
    const canvasBox = () => {
      rig.offset(camera, window.scrollY)
      return canvas.getBoundingClientRect()
    }
    return provideCat({
      hit(x, y) {
        if (!shown()) return false
        const r = canvasBox()
        return rig.hit(camera, x - r.left, y - r.top, r.width, r.height)
      },
      outline() {
        if (!shown()) return null
        const r = canvasBox()
        const o = rig.outline(camera, r.width, r.height)
        if (!o) return null
        for (const b of [o.box, o.head]) {
          b.left += r.left
          b.right += r.left
          b.top += r.top
          b.bottom += r.top
        }
        o.head.topX += r.left
        o.face.left += r.left
        o.face.right += r.left
        o.face.leftY += r.top
        o.face.rightY += r.top
        return o
      },
      highlight(on) {
        input.hover = on
        invalidate()
      },
    })
  }, [rig, camera, canvas, inputRef, invalidate])

  useFrame((state, delta) => {
    // Paused or reduced motion runs on demand: keep asking for frames until
    // a theme change, a scroll dim or the hover ink has finished easing.
    if (rig.update(state, delta, inputRef.current, colorsRef.current, mode) && mode !== 'run') state.invalidate()
  })

  return <primitive object={rig.root} />
}
