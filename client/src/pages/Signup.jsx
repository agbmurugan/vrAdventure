import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: ''
  });
  const [step, setStep] = useState(1); // 1 = Signup Form, 2 = Verification Code
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [mailWarning, setMailWarning] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to sign up');
      
      setMsg(data.message);
      if (data.mail_warning) setMailWarning(data.mail_warning);
      setStep(2); // move to verification
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code: verificationCode })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      
      setMsg(data.message);
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '450px', position: 'relative', overflow: 'hidden' }}>
        
        {/* Glow effect matching premium vibes */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '100px', height: '100px', background: 'var(--primary)', filter: 'blur(50px)', opacity: 0.3, zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 className="heading-xl" style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '0.5rem' }}>
            {step === 1 ? 'Start Your Adventure' : 'Verify Email'}
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            {step === 1 ? 'Create an account to track bookings and tours.' : 'Check your inbox for a verification code.'}
          </p>
          
          {error && <div style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}
          {msg && <div style={{ color: '#10b981', marginBottom: '1rem', textAlign: 'center', background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)' }}>{msg}</div>}
          {mailWarning && (
            <div style={{ marginBottom: '1rem', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '8px', padding: '0.75rem' }}>
              <div style={{ color: '#facc15', fontWeight: 'bold', marginBottom: '0.3rem', fontSize: '0.85rem' }}>⚠️ Email delivery issue</div>
              <div style={{ color: '#fde047', fontSize: '0.8rem', wordBreak: 'break-word' }}>{mailWarning}</div>
            </div>
          )}
          
          {step === 1 && (
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>Full Name</label>
                <input 
                  type="text" name="name" className="form-input" 
                  value={formData.name} onChange={handleInputChange} 
                  placeholder="John Doe" required style={{ transition: 'all 0.3s ease' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>Email</label>
                  <input 
                    type="email" name="email" className="form-input" 
                    value={formData.email} onChange={handleInputChange} 
                    placeholder="john@example.com" required 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>Phone Number</label>
                  <input 
                    type="tel" name="phone" className="form-input" 
                    value={formData.phone} onChange={handleInputChange} 
                    placeholder="+1 234 567 8900" required 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>Address</label>
                <input 
                  type="text" name="address" className="form-input" 
                  value={formData.address} onChange={handleInputChange} 
                  placeholder="123 Adventure Lane, City" required 
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>Password</label>
                <input 
                  type="password" name="password" className="form-input" 
                  value={formData.password} onChange={handleInputChange} 
                  placeholder="••••••••" required 
                />
              </div>
              
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem', width: '100%', position: 'relative', overflow: 'hidden' }}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>

              <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Already have an account? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>Login</Link>
              </p>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-main)', textAlign: 'center' }}>Enter Verification Code</label>
                <input 
                  type="text" className="form-input" 
                  value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} 
                  placeholder="------" required style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}
                  maxLength="6"
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
