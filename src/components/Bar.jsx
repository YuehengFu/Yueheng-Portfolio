import ThemeToggle from './ThemeToggle.jsx'

export default function Bar({ theme, onToggleTheme }) {
  return (
    <header className="bar">
      <a className="name" href="#top">
        yueheng fu
      </a>
      <nav aria-label="sections">
        <a className="nav-experience" href="#experience">
          experience
        </a>
        <a href="#scrapbook">scrapbook</a>
        <a href="#contact">contact</a>
      </nav>
      <ThemeToggle theme={theme} onToggle={onToggleTheme} />
    </header>
  )
}
