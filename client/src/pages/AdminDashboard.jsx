import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form State
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    duration: ''
  });

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'admin') {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tours`);
      if (!res.ok) throw new Error('Failed to fetch packages');
      const data = await res.json();
      setPackages(data);
      setError(null);
    } catch (e) {
      console.error('Failed to fetch packages:', e);
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.description || formData.price === '' || formData.duration === '') {
      alert("All fields are required!");
      return;
    }

    try {
      if (editingId) {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tours/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            price: Number(formData.price),
            duration: Number(formData.duration)
          })
        });
        if (!res.ok) throw new Error('Failed to update');
      } else {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tours`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            price: Number(formData.price),
            duration: Number(formData.duration)
          })
        });
        if (!res.ok) throw new Error('Failed to create');
      }
      setFormData({ title: '', description: '', price: '', duration: '' });
      setEditingId(null);
      fetchPackages();
    } catch (err) {
      console.error(err);
      alert("Error saving package");
    }
  };

  const handleEdit = (pkg) => {
    setFormData({
      title: pkg.title,
      description: pkg.description,
      price: pkg.price.toString(),
      duration: pkg.duration.toString()
    });
    setEditingId(pkg.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this package?")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tours/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete');
      fetchPackages();
    } catch (err) {
      console.error(err);
      alert("Error deleting package");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    window.dispatchEvent(new Event('auth-change'));
    navigate('/login');
  };

  if (loading && packages.length === 0) return <div className="container" style={{ textAlign: 'center', marginTop: '20vh' }}><h3>Loading Dashboard...</h3></div>;
  if (error) return <div className="container" style={{ color: '#ef4444', textAlign: 'center' }}><h3>System Error: {error.message}</h3></div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="heading-xl" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your VR Tour Packages (Data stored in local DuckDB)</p>
        </div>
        <button onClick={handleLogout} className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>Logout</button>
      </div>

      <div className="grid-3" style={{ gridTemplateColumns: 'minmax(300px, 1fr) minmax(500px, 2fr)', alignItems: 'start' }}>
        {/* Form panel */}
        <div className="glass-card" style={{ position: 'sticky', top: '100px' }}>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
            {editingId ? '✏️ Edit Package' : '✨ Add New Package'}
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Package Title</label>
              <input type="text" name="title" className="form-input" value={formData.title} onChange={handleInputChange} placeholder="e.g. Rome VR Tour" required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Description</label>
              <textarea name="description" className="form-input" rows="3" value={formData.description} onChange={handleInputChange} placeholder="Describe the experience..." required />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Price ($)</label>
                <input type="number" step="0.01" min="0" name="price" className="form-input" value={formData.price} onChange={handleInputChange} placeholder="0.00" required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Duration (mins)</label>
                <input type="number" min="1" name="duration" className="form-input" value={formData.duration} onChange={handleInputChange} placeholder="60" required />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingId ? 'Save Changes' : 'Create Package'}</button>
              {editingId && (
                <button type="button" className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.2)' }} onClick={() => { setEditingId(null); setFormData({title: '', description: '', price: '', duration: ''}); }}>Cancel</button>
              )}
            </div>
          </form>
        </div>

        {/* List panel */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', width: '50px' }}>ID</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Package Layout</th>
                  <th style={{ padding: '1rem', textAlign: 'center', width: '100px' }}>Price</th>
                  <th style={{ padding: '1rem', textAlign: 'center', width: '100px' }}>Duration</th>
                  <th style={{ padding: '1rem', textAlign: 'right', width: '140px' }}>Manage</th>
                </tr>
              </thead>
              <tbody>
                {packages.map(pkg => (
                  <tr key={pkg.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>#{pkg.id}</td>
                    <td style={{ padding: '1rem' }}>
                      <strong style={{ display: 'block', marginBottom: '0.2rem', color: 'var(--primary)' }}>{pkg.title}</strong>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{pkg.description}</div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>${pkg.price.toFixed(2)}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>{pkg.duration}m</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button onClick={() => handleEdit(pkg)} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', marginRight: '0.5rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}>Edit</button>
                      <button onClick={() => handleDelete(pkg.id)} className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>Del</button>
                    </td>
                  </tr>
                ))}
                {packages.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No packages found. Time to create your first VR experience!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
