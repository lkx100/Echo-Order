import { useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

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
import AdminRoute from './components/AdminRoute.jsx';
import AdminLayout from './components/Admin/AdminLayout.jsx';
import AdminSetup from './components/Admin/AdminSetup.jsx';
import AdminDashboard from './components/Admin/AdminDashboard.jsx';
import AdminChat from './components/Admin/AdminChat.jsx';

import './App.css';

function AppContent() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="app">
      {!isAdminPage && <Navbar />}
      <Routes>
        {/* Public landing page */}
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

        {/* Customer chat */}
        <Route path="/chat" element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin setup — full-screen, no sidebar */}
        <Route path="/admin/setup" element={
          <AdminRoute>
            <AdminSetup />
          </AdminRoute>
        } />

        {/* Admin pages — sidebar layout via AdminLayout + Outlet */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="chat" element={<AdminChat />} />
        </Route>
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
