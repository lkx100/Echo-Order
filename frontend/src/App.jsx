import Navbar from './components/Navbar/Navbar';
import Hero from './components/Hero/Hero';
import Stats from './components/Stats/Stats';
import HowItWorks from './components/HowItWorks/HowItWorks';
import Reviews from './components/Reviews/Reviews';
import Pricing from './components/Pricing/Pricing';
import Footer from './components/Footer/Footer';
import Chat from './components/Chat/Chat.jsx';
import { Routes, Route } from 'react-router-dom';
import './App.css';

const API_BASE = 'http://localhost:8000'

function App() {
  return (
    <div className='app'>
      <Navbar />
      <Routes>
        <Route path="/" element={
          <>
            <Hero />
            <Stats />
            <HowItWorks />
            <Reviews />
            <Pricing />
            <Footer />
          </>
        } />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </div>
  )
}

export default App
