function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <p>© {new Date().getFullYear()} Yueheng Fu</p>
        <p>
          Pixel fonts from the{" "}
          <a href="https://int10h.org/oldschool-pc-fonts/" target="_blank" rel="noreferrer">
            Oldschool PC Font Resource
          </a>{" "}
          by VileR, CC BY-SA 4.0
        </p>
      </div>
    </footer>
  );
}

export default Footer;
