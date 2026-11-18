import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Projects from "./components/Projects";
import Experiences from "./components/Experiences";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import "./App.css";

function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Projects />
        <Experiences />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

export default App;
