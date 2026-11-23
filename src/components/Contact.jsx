import { useEffect, useRef, useState } from 'react'
import Section from './Section.jsx'
import Arrow from './Arrow.jsx'
import { EMAIL, GITHUB } from '../content.js'

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Older browsers or an insecure context: the textarea route.
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
    document.body.append(area)
    area.select()
    try {
      return document.execCommand('copy')
    } catch {
      return false
    } finally {
      area.remove()
    }
  }
}

function CopyEmail() {
  const [state, setState] = useState('idle') // idle | copied | failed
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = async () => {
    const ok = await copyText(EMAIL)
    setState(ok ? 'copied' : 'failed')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), 1600)
  }

  return (
    <>
      <button type="button" className="copy" onClick={copy} data-state={state}>
        {state === 'copied' ? 'copied' : 'copy'}
        <span className="sr-only"> email address</span>
      </button>
      <span className="sr-only" aria-live="polite">
        {state === 'copied' ? 'email address copied' : state === 'failed' ? `couldn't copy. the address is ${EMAIL}` : ''}
      </span>
    </>
  )
}

export default function Contact() {
  return (
    <Section id="contact" label="contact">
      <p>reach out by email, or find me on github.</p>
      <p className="links">
        <span className="email">
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          <CopyEmail />
        </span>
        <a href={GITHUB} target="_blank" rel="noreferrer">
          github
          <Arrow />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </p>
    </Section>
  )
}
