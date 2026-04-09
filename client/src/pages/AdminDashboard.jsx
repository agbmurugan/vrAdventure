import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const statusStyles = {
  upcoming: { bg: 'rgba(99,102,241,0.15)', color: '#a5b4fc', label: '🗓 Upcoming' },
  completed: { bg: 'rgba(52,211,153,0.12)', color: '#34d399', label: '✈️ Completed' },
  cancelled: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', label: '✕ Cancelled' },
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tours');

  // Packages State
  const [packages, setPackages] = useState([]);
  const [loadingTours, setLoadingTours] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', price: '', duration: '', image_url: '' });

  // Users State
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Bookings State
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingStats, setBookingStats] = useState(null);
  const [newBookingCount, setNewBookingCount] = useState(0);

  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'admin') navigate('/login');
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'tours') fetchPackages();
    else if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'bookings') { fetchBookings(); fetchBookingStats(); }
  }, [activeTab]);

  // Also fetch booking stats once on mount to show notification badge
  useEffect(() => {
    fetchBookingStats();
  }, []);

  // ─── PACKAGE LOGIC ─────────────────────────────────────────────────────
  const fetchPackages = async () => {
    setLoadingTours(true);
    try {
      const res = await fetch(`${API}/api/tours`);
      if (!res.ok) throw new Error('Failed to fetch packages');
      const data = await res.json();
      setPackages(data);
      setError(null);
    } catch (e) { setError(e); }
    finally { setLoadingTours(false); }
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmitPackage = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || formData.price === '' || formData.duration === '') {
      alert('All fields are required!'); return;
    }
    try {
      const url = `${API}/api/tours` + (editingId ? `/${editingId}` : '');
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, price: Number(formData.price), duration: Number(formData.duration) })
      });
      if (!res.ok) throw new Error('Failed to save');
      setFormData({ title: '', description: '', price: '', duration: '', image_url: '' });
      setEditingId(null);
      fetchPackages();
    } catch (err) { alert('Error saving package'); }
  };

  const handleEditPackage = (pkg) => {
    setFormData({ title: pkg.title, description: pkg.description, price: pkg.price.toString(), duration: pkg.duration.toString(), image_url: pkg.image_url || '' });
    setEditingId(pkg.id);
  };

  const handleDeletePackage = async (id) => {
    if (!window.confirm('Delete this package?')) return;
    try {
      const res = await fetch(`${API}/api/tours/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      fetchPackages();
    } catch (err) { alert('Error deleting package'); }
  };

  // ─── USER LOGIC ────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
      setError(null);
    } catch (e) { setError(e); }
    finally { setLoadingUsers(false); }
  };

  const handleToggleStatus = async (user) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      const res = await fetch(`${API}/api/users/${user.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      fetchUsers();
    } catch (error) { alert('Error updating user status'); }
  };

  // ─── BOOKING LOGIC ─────────────────────────────────────────────────────
  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await fetch(`${API}/api/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch bookings');
      const data = await res.json();
      setBookings(data);
      setError(null);
    } catch (e) { setError(e); }
    finally { setLoadingBookings(false); }
  };

  const fetchBookingStats = async () => {
    try {
      const res = await fetch(`${API}/api/bookings/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setBookingStats(data);
      setNewBookingCount(data.recent24h || 0);
    } catch (e) { /* silent */ }
  };

  const handleUpdateBookingStatus = async (id, status) => {
    try {
      const res = await fetch(`${API}/api/bookings/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update');
      fetchBookings();
      fetchBookingStats();
    } catch (err) { alert('Error updating booking status'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    window.dispatchEvent(new Event('auth-change'));
    navigate('/login');
  };

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="heading-xl" style={{ fontSize: '2.5rem', marginBottom: '0.2rem' }}>Admin Control Base</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage packages, users, and bookings</p>
        </div>
        <button onClick={handleLogout} className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>Logout</button>
      </div>

      {/* Notification Banner */}
      {newBookingCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px', padding: '0.9rem 1.25rem', marginBottom: '1.75rem' }}>
          <Bell size={20} style={{ color: '#a5b4fc', flexShrink: 0 }} />
          <div>
            <strong style={{ color: '#a5b4fc' }}>{newBookingCount} new booking{newBookingCount > 1 ? 's' : ''}</strong>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}> in the last 24 hours — check the Bookings tab.</span>
          </div>
          <button onClick={() => setActiveTab('bookings')} style={{ marginLeft: 'auto', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.3rem 0.9rem', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '600' }}>View</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '2rem' }}>
        {[
          { id: 'tours', label: 'Tour Packages' },
          { id: 'users', label: 'User Management' },
          { id: 'bookings', label: 'Bookings', badge: newBookingCount },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '-1px' }}>
            {tab.label}
            {tab.badge > 0 && (
              <span style={{ background: '#ef4444', color: '#fff', borderRadius: '999px', padding: '1px 7px', fontSize: '0.72rem', fontWeight: '700' }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && <div style={{ color: '#ef4444', textAlign: 'center', marginBottom: '1rem' }}><h3>Error: {error.message || String(error)}</h3></div>}

      {/* ─── TOURS TAB ─── */}
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
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Price (₹)</label>
                  <input type="number" step="0.01" name="price" className="form-input" value={formData.price} onChange={handleInputChange} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Duration (m)</label>
                  <input type="number" name="duration" className="form-input" value={formData.duration} onChange={handleInputChange} required />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Image URL <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>(optional)</span></label>
                <input type="url" name="image_url" className="form-input" value={formData.image_url} onChange={handleInputChange} placeholder="https://images.unsplash.com/..." />
                {formData.image_url && (
                  <div style={{ marginTop: '0.5rem', borderRadius: '8px', overflow: 'hidden', height: '80px' }}>
                    <img src={formData.image_url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingId ? 'Save Changes' : 'Create Package'}</button>
                {editingId && <button type="button" className="btn btn-outline" onClick={() => { setEditingId(null); setFormData({ title: '', description: '', price: '', duration: '', image_url: '' }); }}>Cancel</button>}
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
                          <strong style={{ display: 'block', color: 'var(--primary)', marginBottom: '0.2rem' }}>{pkg.title}</strong>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{pkg.description}</div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>₹{Number(pkg.price).toLocaleString('en-IN')}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>{pkg.duration}m</td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <button onClick={() => handleEditPackage(pkg)} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', marginRight: '0.5rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}>Edit</button>
                          <button onClick={() => handleDeletePackage(pkg.id)} className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>Del</button>
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

      {/* ─── USERS TAB ─── */}
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
                        <div><strong style={{ color: 'var(--text-main)' }}>M:</strong> {user.phone || 'N/A'}</div>
                        <div style={{ marginTop: '0.2rem' }}><strong style={{ color: 'var(--text-main)' }}>A:</strong> {user.address || 'N/A'}</div>
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
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: user.status === 'active' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: user.status === 'active' ? '#ef4444' : '#10b981' }}>
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

      {/* ─── BOOKINGS TAB ─── */}
      {activeTab === 'bookings' && (
        <div>
          {/* Booking Stats */}
          {bookingStats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
              {[
                { label: 'Total Bookings', value: bookingStats.total, color: '#a5b4fc' },
                { label: 'Upcoming', value: bookingStats.upcoming, color: '#6366f1' },
                { label: 'Completed', value: bookingStats.completed, color: '#34d399' },
                { label: 'Total Revenue', value: `₹${Number(bookingStats.revenue).toLocaleString('en-IN')}`, color: '#fbbf24' },
                { label: 'Last 24h', value: bookingStats.recent24h, color: '#f97316' },
              ].map(s => (
                <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1.1rem 1.25rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>{s.label}</div>
                  <div style={{ color: s.color, fontWeight: '700', fontSize: '1.5rem' }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}

          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            {loadingBookings ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>Loading bookings...</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)' }}>#</th>
                      <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Customer</th>
                      <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tour Package</th>
                      <th style={{ padding: '0.9rem 1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Travel Date</th>
                      <th style={{ padding: '0.9rem 1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Paid</th>
                      <th style={{ padding: '0.9rem 1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status</th>
                      <th style={{ padding: '0.9rem 1rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(b => {
                      const st = statusStyles[b.status] || statusStyles.upcoming;
                      const travelDate = new Date(b.tour_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                      const bookedOn = new Date(b.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                      return (
                        <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>#{b.id}</td>
                          <td style={{ padding: '0.9rem 1rem' }}>
                            <strong style={{ display: 'block', fontSize: '0.95rem' }}>{b.user_name}</strong>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.user_email}</div>
                            {b.user_phone && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>📱 {b.user_phone}</div>}
                            <div style={{ fontSize: '0.75rem', color: 'rgba(148,163,184,0.5)', marginTop: '0.2rem' }}>Booked: {bookedOn}</div>
                          </td>
                          <td style={{ padding: '0.9rem 1rem' }}>
                            <div style={{ color: '#a5b4fc', fontWeight: '600', fontSize: '0.9rem' }}>{b.tour_title}</div>
                            {b.duration && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>⏱ {b.duration} mins</div>}
                          </td>
                          <td style={{ padding: '0.9rem 1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                            📅 {travelDate}
                          </td>
                          <td style={{ padding: '0.9rem 1rem', textAlign: 'center', color: '#34d399', fontWeight: '700' }}>
                            ₹{Number(b.price_paid).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                            <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '600' }}>
                              {st.label}
                            </span>
                          </td>
                          <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                            {b.status === 'upcoming' && (
                              <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                <button onClick={() => handleUpdateBookingStatus(b.id, 'completed')} className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', background: 'rgba(52,211,153,0.1)', color: '#34d399' }}>
                                  ✓ Done
                                </button>
                                <button onClick={() => handleUpdateBookingStatus(b.id, 'cancelled')} className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                                  ✕ Cancel
                                </button>
                              </div>
                            )}
                            {b.status !== 'upcoming' && (
                              <button onClick={() => handleUpdateBookingStatus(b.id, 'upcoming')} className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', background: 'rgba(99,102,241,0.1)', color: '#a5b4fc' }}>
                                ↺ Reopen
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {bookings.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No bookings yet. They will appear here once users start booking.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
