import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { Compass, LogOut } from 'lucide-react'
import Home from './pages/Home'
import VRTours from './pages/VRTours'
import BookingPlatform from './pages/BookingPlatform'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import AdminDashboard from './pages/AdminDashboard'
import './index.css'

function AppContent() {
  const [role, setRole] = useState(localStorage.getItem('userRole'));
  const location = useLocation();

  useEffect(() => {
    const handleAuthChange = () => setRole(localStorage.getItem('userRole'));
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    window.dispatchEvent(new Event('auth-change'));
  };

  return (
    <div className="min-h-screen app-container">
      {/* Modern Navbar only if authenticated */}
      {role && (
        <nav className="navbar">
          <div className="nav-brand">
            <Compass size={28} className="icon-pulse text-primary" />
            <span className="brand-text">vrAdventure</span>
          </div>
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/vr-tours" className="nav-link">VR Tours</Link>
            <Link to="/booking" className="nav-link">Booking</Link>
            {role === 'admin' && (
              <Link to="/admin" className="nav-link" style={{color: 'var(--primary)'}}>Admin Dashboard</Link>
            )}
            <button onClick={handleLogout} className="nav-link" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <LogOut size={18} /> Logout
            </button>
          </div>
        </nav>
      )}

      {/* Main Content Area */}
      <main className={role ? "main-content" : "main-content-login"}>
        <Routes>
          <Route path="/login" element={!role ? <Login /> : <Navigate to="/" replace />} />
          <Route path="/signup" element={!role ? <Signup /> : <Navigate to="/" replace />} />
          <Route path="/forgot-password" element={!role ? <ForgotPassword /> : <Navigate to="/" replace />} />
          
          {role ? (
            <>
              <Route path="/" element={<Home />} />
              <Route path="/vr-tours" element={<VRTours />} />
              <Route path="/booking" element={<BookingPlatform />} />
              {role === 'admin' && <Route path="/admin" element={<AdminDashboard />} />}
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
