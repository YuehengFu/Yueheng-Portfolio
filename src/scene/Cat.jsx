import { useEffect, useMemo } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { CatLoader } from './CatLoader.js'
import { CatRig } from './CatRig.js'

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

  useEffect(() => () => rig.dispose(), [rig])
  useEffect(() => onReady(), [onReady])
  useEffect(() => {
    rig.frame(camera, width, height)
    invalidate()
  }, [rig, camera, width, height, invalidate])

  useFrame((state, delta) => {
    // Paused or reduced motion runs on demand: keep asking for frames until
    // a theme change or a scroll dim has finished easing.
    if (rig.update(state, delta, inputRef.current, colorsRef.current, mode) && mode !== 'run') state.invalidate()
  })

  return <primitive object={rig.root} />
}
