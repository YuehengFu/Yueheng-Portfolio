import { useState } from 'react'
import Backdrop from './components/Backdrop.jsx'
import Bar from './components/Bar.jsx'
import Intro from './components/Intro.jsx'
import Experience from './components/Experience.jsx'
import Scrapbook from './components/Scrapbook.jsx'
import Peek from './components/Peek.jsx'
import Otherwise from './components/Otherwise.jsx'
import Contact from './components/Contact.jsx'
import Footer from './components/Footer.jsx'
import { hasWebGL, usePaused, useReducedMotion, useTheme } from './hooks.js'
import { useCatCard } from './catCard.js'

export default function App() {
  const [theme, toggleTheme] = useTheme()
  const [paused, togglePaused] = usePaused()
  const reduced = useReducedMotion()
  const [webgl] = useState(hasWebGL)
  const { cardRef, creditRef, ...card } = useCatCard()

  return (
    <>
      <a className="skip" href="#main">
        skip to content
      </a>
      <Backdrop webgl={webgl} paused={paused} reduced={reduced} />

      <div className="page" id="top">
        <Bar theme={theme} onToggleTheme={toggleTheme} />
        <main id="main" className="column" tabIndex={-1}>
          <Intro />
          <Experience />
          <Scrapbook />
          <Otherwise />
          <Contact />
        </main>
        <Peek reduced={reduced} />
        <Footer canPause={webgl && !reduced} paused={paused} onTogglePause={togglePaused} card={card} cardRef={cardRef} creditRef={creditRef} />
      </div>
    </>
  )
}
