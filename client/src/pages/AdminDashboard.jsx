import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tours'); // 'tours' or 'users'
  
  // Packages State
  const [packages, setPackages] = useState([]);
  const [loadingTours, setLoadingTours] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', price: '', duration: '', image_url: '' });

  // Users State
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [error, setError] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'admin') {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'tours') {
      fetchPackages();
    } else {
      fetchUsers();
    }
  }, [activeTab]);

  // --- PACKAGE LOGIC ---
  const fetchPackages = async () => {
    setLoadingTours(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tours`);
      if (!res.ok) throw new Error('Failed to fetch packages');
      const data = await res.json();
      setPackages(data);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoadingTours(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitPackage = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || formData.price === '' || formData.duration === '') {
      alert("All fields are required!"); return;
    }
    try {
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tours` + (editingId ? `/${editingId}` : '');
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, price: Number(formData.price), duration: Number(formData.duration) })
      });
      if (!res.ok) throw new Error('Failed to save');
      setFormData({ title: '', description: '', price: '', duration: '', image_url: '' });
      setEditingId(null);
      fetchPackages();
    } catch (err) {
      alert("Error saving package");
    }
  };

  const handleEditPackage = (pkg) => {
    setFormData({ title: pkg.title, description: pkg.description, price: pkg.price.toString(), duration: pkg.duration.toString(), image_url: pkg.image_url || '' });
    setEditingId(pkg.id);
  };

  const handleDeletePackage = async (id) => {
    if (!window.confirm("Delete this package?")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tours/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      fetchPackages();
    } catch (err) {
      alert("Error deleting package");
    }
  };

  // --- USER LOGIC ---
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/${user.id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      fetchUsers(); // refresh list
    } catch (error) {
      alert('Error updating user status');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('auth-change'));
    navigate('/login');
  };

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="heading-xl" style={{ fontSize: '2.5rem', marginBottom: '0.2rem' }}>Admin Control Base</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage packages and system users</p>
        </div>
        <button onClick={handleLogout} className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>Logout</button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '2rem' }}>
        <button 
          onClick={() => setActiveTab('tours')} 
          style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', color: activeTab === 'tours' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'tours' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', transition: 'all 0.2s' }}
        >
          Tour Packages
        </button>
        <button 
          onClick={() => setActiveTab('users')} 
          style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', color: activeTab === 'users' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'users' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', transition: 'all 0.2s' }}
        >
          User Management
        </button>
      </div>

      {error && <div style={{ color: '#ef4444', textAlign: 'center', marginBottom: '1rem' }}><h3>System Error: {error.message}</h3></div>}

      {/* --- TOURS TAB --- */}
      {activeTab === 'tours' && (
        <div className="grid-3" style={{ gridTemplateColumns: 'minmax(300px, 1fr) minmax(500px, 2fr)', alignItems: 'start' }}>
          <div className="glass-card" style={{ position: 'sticky', top: '20px' }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
              {editingId ? '✏️ Edit Package' : '✨ Add New Package'}
            </h2>
            <form onSubmit={handleSubmitPackage} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Package Title</label>
                <input type="text" name="title" className="form-input" value={formData.title} onChange={handleInputChange} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Description</label>
                <textarea name="description" className="form-input" rows="3" value={formData.description} onChange={handleInputChange} required />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Price ($)</label>
                  <input type="number" step="0.01" name="price" className="form-input" value={formData.price} onChange={handleInputChange} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Duration (m)</label>
                  <input type="number" name="duration" className="form-input" value={formData.duration} onChange={handleInputChange} required />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Image URL <span style={{color:'var(--text-muted)',fontWeight:'normal'}}>(optional)</span></label>
                <input type="url" name="image_url" className="form-input" value={formData.image_url} onChange={handleInputChange} placeholder="https://images.unsplash.com/..." />
                {formData.image_url && (
                  <div style={{ marginTop: '0.5rem', borderRadius: '8px', overflow: 'hidden', height: '80px' }}>
                    <img src={formData.image_url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display='none'} />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingId ? 'Save Changes' : 'Create Package'}</button>
                {editingId && <button type="button" className="btn btn-outline" onClick={() => { setEditingId(null); setFormData({title: '', description: '', price: '', duration: '', image_url: ''}); }}>Cancel</button>}
              </div>
            </form>
          </div>

          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            {loadingTours ? <div style={{ padding: '2rem', textAlign: 'center' }}>Loading packages...</div> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', width: '50px' }}>ID</th>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Package Info</th>
                      <th style={{ padding: '1rem', textAlign: 'center', width: '80px' }}>Price</th>
                      <th style={{ padding: '1rem', textAlign: 'center', width: '80px' }}>Dur.</th>
                      <th style={{ padding: '1rem', textAlign: 'right', width: '140px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packages.map(pkg => (
                      <tr key={pkg.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>#{pkg.id}</td>
                        <td style={{ padding: '1rem' }}>
                          <strong style={{ display: 'block', color: 'var(--primary)', marginBottom:'0.2rem' }}>{pkg.title}</strong>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{pkg.description}</div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>${pkg.price}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>{pkg.duration}m</td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <button onClick={() => handleEditPackage(pkg)} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', marginRight: '0.5rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}>Edit</button>
                          <button onClick={() => handleDeletePackage(pkg.id)} className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>Del</button>
                        </td>
                      </tr>
                    ))}
                    {packages.length === 0 && <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>No packages.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- USERS TAB --- */}
      {activeTab === 'users' && (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          {loadingUsers ? <div style={{ padding: '2rem', textAlign: 'center' }}>Loading users...</div> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>User Details</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Contact</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Role</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem' }}>
                        <strong style={{ display: 'block', marginBottom: '0.2rem' }}>{user.name}</strong>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user.email}</div>
                        {user.is_verified ? 
                          <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'inline-block', marginTop: '0.3rem', background: 'rgba(16,185,129,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>✓ Verified</span> : 
                          <span style={{ fontSize: '0.75rem', color: '#f59e0b', display: 'inline-block', marginTop: '0.3rem', background: 'rgba(245,158,11,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Pending</span>
                        }
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        <div><strong style={{color:'var(--text-main)'}}>M:</strong> {user.phone || 'N/A'}</div>
                        <div style={{marginTop:'0.2rem'}}><strong style={{color:'var(--text-main)'}}>A:</strong> {user.address || 'N/A'}</div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', background: user.role === 'admin' ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.1)', color: user.role === 'admin' ? '#d8b4fe' : 'var(--text-main)' }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: user.status === 'active' ? '#10b981' : '#ef4444' }}></span>
                          {user.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        {user.role !== 'admin' && (
                          <button 
                            onClick={() => handleToggleStatus(user)} 
                            className="btn" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: user.status === 'active' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: user.status === 'active' ? '#ef4444' : '#10b981' }}
                          >
                            {user.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                        {user.role === 'admin' && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Reserved</span>}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>No users found.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
