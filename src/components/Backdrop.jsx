import { lazy, Suspense } from 'react'

// three.js arrives in its own chunk, after the text has painted. The canvas
// is fixed behind the page, so nothing moves when it arrives.
const CatStage = lazy(() => import('../scene/CatStage.jsx'))
// Only browsers without WebGL need the drawing, so it is a chunk of its own.
const StaticCat = lazy(() => import('../scene/StaticCat.jsx'))

export default function Backdrop({ webgl, paused, reduced }) {
  if (!webgl) {
    return (
      <div className="stage" aria-hidden="true">
        <Suspense fallback={null}>
          <StaticCat />
        </Suspense>
      </div>
    )
  }
  return (
    <Suspense fallback={null}>
      <CatStage paused={paused} reduced={reduced} />
    </Suspense>
  )
}
