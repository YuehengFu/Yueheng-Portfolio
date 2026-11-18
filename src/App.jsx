import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Stats from "./components/Stats";
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
        <Stats />
        <Experiences />
        <Projects />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

export default App;
