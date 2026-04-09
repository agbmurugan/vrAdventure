import React, { useState, useEffect } from 'react'
import { ShieldCheck, TrendingDown, Clock, CheckCircle, Calendar, MapPin, Ticket, Plane, Package, AlertCircle } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const statusColors = {
  upcoming: { bg: 'rgba(99,102,241,0.15)', color: '#a5b4fc', dot: '#6366f1', label: '🗓 Upcoming' },
  completed: { bg: 'rgba(52,211,153,0.12)', color: '#34d399', dot: '#10b981', label: '✈️ Travelled' },
  cancelled: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', dot: '#ef4444', label: '✕ Cancelled' },
}

export default function BookingPlatform() {
  const [activeTab, setActiveTab] = useState('book')
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activePackage, setActivePackage] = useState(null)
  const [pricing, setPricing] = useState({ base: 0, current: 0, discount: 0 })
  const [isBooking, setIsBooking] = useState(false)
  const [booked, setBooked] = useState(false)
  const [bookingResult, setBookingResult] = useState(null)
  const [tourDate, setTourDate] = useState('')
  const [dateError, setDateError] = useState('')

  const [myBookings, setMyBookings] = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingsError, setBookingsError] = useState(null)

  const token = localStorage.getItem('token')
  const userName = localStorage.getItem('userName') || 'Traveller'
  const userEmail = localStorage.getItem('userEmail') || ''

  // Minimum selectable date = tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  // Load available packages
  useEffect(() => {
    const fetchTours = async () => {
      try {
        const response = await fetch(`${API}/api/tours`)
        if (!response.ok) throw new Error('Failed to fetch tours')
        const data = await response.json()
        setPackages(data)
        setLoading(false)
      } catch (err) {
        setError(err)
        setLoading(false)
      }
    }
    fetchTours()
  }, [])

  // Fetch user bookings when tab changes
  useEffect(() => {
    if (activeTab === 'mybookings' || activeTab === 'mytravels') {
      fetchMyBookings()
    }
  }, [activeTab])

  const fetchMyBookings = async () => {
    setBookingsLoading(true)
    setBookingsError(null)
    try {
      const res = await fetch(`${API}/api/bookings/my`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch bookings')
      const data = await res.json()
      setMyBookings(data)
    } catch (err) {
      setBookingsError(err.message)
    } finally {
      setBookingsLoading(false)
    }
  }

  // Dynamic Pricing
  useEffect(() => {
    if (!activePackage) return
    setPricing({ base: activePackage.price, current: activePackage.price, discount: 0 })
    const interval = setInterval(() => {
      const fluctuation = Math.floor(Math.random() * (activePackage.price * 0.1)) - (activePackage.price * 0.05)
      setPricing(prev => {
        const newPrice = Math.max(activePackage.price * 0.6, prev.current + fluctuation)
        const discount = ((prev.base - newPrice) / prev.base * 100).toFixed(1)
        return { ...prev, current: Number(newPrice.toFixed(2)), discount: discount > 0 ? discount : 0 }
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [activePackage])

  const handleBooking = async () => {
    if (!tourDate) { setDateError('Please select a travel date'); return }
    setDateError('')
    setIsBooking(true)
    try {
      const res = await fetch(`${API}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tour_id: activePackage.id,
          tour_date: tourDate,
          price_paid: pricing.current
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Booking failed')
      setBookingResult(data.booking)
      setBooked(true)
    } catch (err) {
      alert('Booking failed: ' + err.message)
    } finally {
      setIsBooking(false)
    }
  }

  const upcomingBookings = myBookings.filter(b => b.status === 'upcoming')
  const completedBookings = myBookings.filter(b => b.status === 'completed' || b.status === 'cancelled')

  const tabs = [
    { id: 'book', icon: <Ticket size={16} />, label: 'Book a Tour' },
    { id: 'mybookings', icon: <Package size={16} />, label: 'My Bookings', count: upcomingBookings.length },
    { id: 'mytravels', icon: <Plane size={16} />, label: 'My Travels', count: completedBookings.length },
  ]

  if (loading) return (
    <div className="container" style={{ textAlign: 'center', marginTop: '20vh' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌍</div>
      <h3 style={{ color: 'var(--text-muted)' }}>Loading Booking Engine...</h3>
    </div>
  )

  if (error) return (
    <div className="container" style={{ color: '#ef4444', textAlign: 'center' }}>
      <h3>System Error: {error.message}</h3>
    </div>
  )

  return (
    <div className="container" style={{ padding: '3rem 5%', maxWidth: '950px' }}>
      <header style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h1 className="heading-xl">VR <span className="text-gradient">Travel Booking</span></h1>
        <p style={{ color: 'var(--text-muted)' }}>Book your adventure, track your journeys, relive your travels.</p>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '2rem', overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); if (tab.id === 'book') { setBooked(false); setBookingResult(null); } }}
            style={{
              padding: '0.75rem 1.25rem',
              background: 'none',
              border: 'none',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.95rem',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              whiteSpace: 'nowrap',
              marginBottom: '-1px'
            }}
          >
            {tab.icon} {tab.label}
            {tab.count > 0 && (
              <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '999px', padding: '1px 7px', fontSize: '0.75rem', fontWeight: '700' }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── BOOK A TOUR TAB ── */}
      {activeTab === 'book' && (
        <>
          {booked ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <CheckCircle size={64} className="text-secondary icon-pulse" style={{ margin: '0 auto 1.5rem auto' }} />
              <h2 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>Booking Confirmed! 🎉</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '1.05rem' }}>
                Your <strong style={{ color: 'var(--primary)' }}>{activePackage.title}</strong> adventure is booked!
              </p>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                📧 A confirmation email has been sent to <strong style={{ color: '#a5b4fc' }}>{userEmail}</strong>.<br />
                📅 Travel Date: <strong style={{ color: '#34d399' }}>{new Date(tourDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
              </p>
              {bookingResult && (
                <div style={{ display: 'inline-block', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px', padding: '0.75rem 2rem', marginBottom: '2rem' }}>
                  <span style={{ color: '#a5b4fc', fontWeight: '700', fontSize: '0.95rem' }}>Booking ID: #{bookingResult.id}</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => { setBooked(false); setActivePackage(null); setTourDate(''); }}>Book Another Trip</button>
                <button className="btn btn-outline" onClick={() => setActiveTab('mybookings')}>View My Bookings →</button>
              </div>
            </div>
          ) : !activePackage ? (
            <div className="glass-card">
              <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>🌏 Select a Package to Book</h2>
              {packages.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No packages currently available.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {packages.map(pkg => (
                    <div key={pkg.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem 1.25rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.02)', transition: 'border-color 0.2s' }}>
                      {pkg.image_url && (
                        <img src={pkg.image_url} alt={pkg.title} style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />
                      )}
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>{pkg.title}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{pkg.duration} mins · <span style={{ color: '#34d399', fontWeight: '600' }}>₹{Number(pkg.price).toLocaleString('en-IN')}</span></p>
                      </div>
                      <button className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }} onClick={() => setActivePackage(pkg)}>Select</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card">
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ color: 'var(--primary)', marginBottom: '0.3rem' }}>{activePackage.title}</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{activePackage.description}</p>
                </div>
                <button className="btn btn-outline" style={{ padding: '0.5rem 1rem' }} onClick={() => { setActivePackage(null); setTourDate(''); setDateError(''); }}>← Change Tour</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Dynamic Pricing */}
                <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                      <TrendingDown className="text-primary" size={18} /> Live Market Price
                    </h3>
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>~3s refresh</span>
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: 'monospace', color: 'var(--secondary)' }}>
                    ₹{pricing.current.toLocaleString('en-IN')} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>INR</span>
                  </div>
                  {pricing.discount > 0 ? (
                    <div style={{ color: 'var(--secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>↓ {pricing.discount}% demand discount</div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Demand increasing...</div>
                  )}
                </div>

                {/* Smart Contract Info */}
                <div style={{ padding: '1.5rem', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '1rem', background: 'rgba(139,92,246,0.05)' }}>
                  <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                    <ShieldCheck className="text-accent" size={18} /> Verify Transaction
                  </h3>
                  <ul style={{ listStyle: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <li><strong>Network:</strong> Ethereum L2 (Optimism)</li>
                    <li><strong>Gas Fee:</strong> ~ $0.002</li>
                    <li><strong>Duration:</strong> {activePackage.duration} mins</li>
                    <li><strong>Escrow:</strong> 100% refund if cancelled 48h prior</li>
                  </ul>
                </div>
              </div>

              {/* Travel Date Picker */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)' }}>
                  <Calendar size={18} className="text-primary" /> Select Your Travel Date
                </label>
                <input
                  type="date"
                  min={minDate}
                  value={tourDate}
                  onChange={e => { setTourDate(e.target.value); setDateError(''); }}
                  className="form-input"
                  style={{ maxWidth: '280px', colorScheme: 'dark' }}
                />
                {dateError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ef4444', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    <AlertCircle size={14} /> {dateError}
                  </div>
                )}
                {tourDate && (
                  <div style={{ marginTop: '0.5rem', color: '#34d399', fontSize: '0.85rem' }}>
                    📅 {new Date(tourDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                )}
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '1rem', fontSize: '1.15rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                onClick={handleBooking}
                disabled={isBooking}
              >
                {isBooking ? (
                  <><Clock className="icon-pulse" size={20} /> Confirming Booking...</>
                ) : (
                  `✈️ Confirm Booking - ₹${pricing.current.toLocaleString('en-IN')}`
                )}
              </button>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.75rem' }}>
                📧 Confirmation email will be sent to <strong style={{ color: '#a5b4fc' }}>{userEmail}</strong>
              </p>
            </div>
          )}
        </>
      )}

      {/* ── MY BOOKINGS TAB ── */}
      {activeTab === 'mybookings' && (
        <div>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={22} /> Upcoming Bookings
          </h2>
          {bookingsLoading ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>Loading your bookings...</p>
            </div>
          ) : bookingsError ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
              {bookingsError}
            </div>
          ) : upcomingBookings.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🗺️</div>
              <h3 style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No Upcoming Bookings</h3>
              <button className="btn btn-primary" onClick={() => setActiveTab('book')}>Book Your First Tour →</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {upcomingBookings.map(b => <BookingCard key={b.id} booking={b} />)}
            </div>
          )}
        </div>
      )}

      {/* ── MY TRAVELS TAB ── */}
      {activeTab === 'mytravels' && (
        <div>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plane size={22} /> Travel History
          </h2>
          {bookingsLoading ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>Loading your travel history...</p>
            </div>
          ) : bookingsError ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
              {bookingsError}
            </div>
          ) : completedBookings.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✈️</div>
              <h3 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>No Past Travels Yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Your completed tours will appear here.</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('book')}>Plan Your First Adventure →</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {completedBookings.map(b => <BookingCard key={b.id} booking={b} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BookingCard({ booking }) {
  const st = statusColors[booking.status] || statusColors.upcoming
  const travelDate = new Date(booking.tour_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
  const bookedOn = new Date(booking.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <div style={{ display: 'flex', gap: '1.25rem', padding: '1.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1rem', alignItems: 'flex-start', flexWrap: 'wrap', transition: 'border-color 0.2s' }}>
      {booking.image_url && (
        <img
          src={booking.image_url}
          alt={booking.tour_title}
          style={{ width: '100px', height: '75px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
          onError={e => e.target.style.display = 'none'}
        />
      )}
      <div style={{ flex: 1, minWidth: '200px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: 0 }}>{booking.tour_title}</h3>
          <span style={{ background: st.bg, color: st.color, padding: '2px 10px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '600' }}>
            {st.label}
          </span>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.4rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={13} /> {travelDate}</span>
          {booking.duration && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={13} /> {booking.duration} mins</span>}
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#34d399', fontWeight: '600' }}>₹{Number(booking.price_paid).toLocaleString('en-IN')}</span>
        </div>
        <div style={{ color: 'rgba(148,163,184,0.5)', fontSize: '0.8rem', marginTop: '0.4rem' }}>
          Booking #{booking.id} · Booked on {bookedOn}
        </div>
      </div>
    </div>
  )
}
