import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      localStorage.setItem('userRole', 'admin');
      window.dispatchEvent(new Event('auth-change'));
      navigate('/admin');
    } else if (username === 'user' && password === 'user') {
      localStorage.setItem('userRole', 'user');
      window.location.href = '/';
    } else {
      setError('Invalid credentials. Use admin/admin or user/user.');
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 className="heading-xl" style={{ fontSize: '2rem', textAlign: 'center' }}>Login</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Admin: <code>admin / admin</code><br/>
          User: <code>user / user</code>
        </p>
        
        {error && <p style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>{error}</p>}
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Username</label>
            <input 
              type="text" 
              className="form-input"
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
            <input 
              type="password" 
              className="form-input"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
