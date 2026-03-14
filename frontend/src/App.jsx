import Navbar from './components/Navbar/Navbar';
import Hero from './components/Hero/Hero';
import Stats from './components/Stats/Stats';
import './App.css';

function App() {
  return (
    <div className="app">
      <Navbar />
      <Hero />
      <Stats />
    </div>
  );
}

export default App;
