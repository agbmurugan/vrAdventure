import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (!res.ok) {
         if (data.requires_verification) {
            // we could redirect to a verification page or show a toast
            throw new Error(data.error);
         }
         throw new Error(data.error || 'Login failed');
      }
      
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('token', data.token);
      localStorage.setItem('userName', data.name || '');
      localStorage.setItem('userEmail', data.email || '');
      window.dispatchEvent(new Event('auth-change'));
      
      if (data.role === 'admin') navigate('/admin');
      else navigate('/');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px', position: 'relative', overflow: 'hidden' }}>
        
        {/* Subtle glow for aesthetics */}
        <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '100px', height: '100px', background: 'var(--primary)', filter: 'blur(50px)', opacity: 0.3, zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 className="heading-xl" style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '0.2rem' }}>Welcome Back</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Enter your credentials to access your account.
          </p>
          
          {error && <div style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>Email</label>
              <input 
                type="text" 
                className="form-input"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none' }}>Forgot Password?</Link>
              </div>
              <input 
                type="password" 
                className="form-input"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
                required
              />
            </div>
            
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem', width: '100%' }}>
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>Sign up</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
