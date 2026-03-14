import Navbar from './components/Navbar/Navbar';
import Hero from './components/Hero/Hero';
import Stats from './components/Stats/Stats';
import Chat from './components/Chat/Chat.jsx';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import { useState, useRef } from 'react'

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
          </>
        } />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </div>
  )
}

export default App
