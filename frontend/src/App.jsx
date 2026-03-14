import Navbar from './components/Navbar/Navbar';
import Hero from './components/Hero/Hero';
import Stats from './components/Stats/Stats';
import HowItWorks from './components/HowItWorks/HowItWorks';
import Reviews from './components/Reviews/Reviews';
import Pricing from './components/Pricing/Pricing';
import Footer from './components/Footer/Footer';
import Chat from './components/Chat/Chat.jsx';
import Login from './components/Auth/Login.jsx';
import Register from './components/Auth/Register.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import './App.css';

const API_BASE = 'http://localhost:8000'

function App() {
  return (
    <AuthProvider>
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
          <Route path="/chat" element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App
