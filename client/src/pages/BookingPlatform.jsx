import React, { useState, useEffect } from 'react'
import { ShieldCheck, TrendingDown, Clock, CheckCircle } from 'lucide-react'

export default function BookingPlatform() {
    const [packages, setPackages] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [activePackage, setActivePackage] = useState(null)
    const [pricing, setPricing] = useState({ base: 0, current: 0, discount: 0 })
    const [isBooking, setIsBooking] = useState(false)
    const [booked, setBooked] = useState(false)

    // Load available packages
    useEffect(() => {
        const fetchTours = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tours`);
                if (!response.ok) throw new Error('Failed to fetch tours');
                const data = await response.json();
                setPackages(data);
                setLoading(false);
            } catch (err) {
                console.error("API Error:", err);
                setError(err);
                setLoading(false);
            }
        };
        fetchTours();
    }, []);

    // Simulate Dynamic Pricing relative to the active package
    useEffect(() => {
        if (!activePackage) return;
        
        // Reset pricing to package base
        setPricing({ base: activePackage.price, current: activePackage.price, discount: 0 });

        const interval = setInterval(() => {
            const fluctuation = Math.floor(Math.random() * (activePackage.price * 0.1)) - (activePackage.price * 0.05); // +/- 5% range
            setPricing(prev => {
                const newPrice = Math.max(activePackage.price * 0.6, prev.current + fluctuation)
                const discount = ((prev.base - newPrice) / prev.base * 100).toFixed(1)
                return { ...prev, current: Number(newPrice.toFixed(2)), discount: discount > 0 ? discount : 0 }
            })
        }, 3000)
        
        return () => clearInterval(interval)
    }, [activePackage])

    const handleSmartContractBooking = () => {
        setIsBooking(true)
        setTimeout(() => {
            setIsBooking(false)
            setBooked(true)
        }, 2500)
    }

    if (loading) return <div className="container" style={{ textAlign: 'center', marginTop: '20vh' }}><h3>Loading Booking Engine...</h3></div>;
    if (error) return <div className="container" style={{ color: '#ef4444', textAlign: 'center' }}><h3>System Error: {error.message}</h3></div>;

    return (
        <div className="container" style={{ padding: '4rem 5%', maxWidth: '900px' }}>
            <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h1 className="heading-xl">Web3 <span className="text-gradient">Smart Booking</span></h1>
                <p style={{ color: 'var(--text-muted)' }}>Secure, zero-fee blockchain transactions with real-time dynamic pricing for your VR adventures.</p>
            </header>

            {booked ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <CheckCircle size={64} className="text-secondary icon-pulse" style={{ margin: '0 auto 1.5rem auto' }} />
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Smart Contract Executed</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Your {activePackage.title} itinerary has been locked on the blockchain. Have a safe adventure!</p>
                    <button className="btn btn-primary" onClick={() => { setBooked(false); setActivePackage(null); }}>Book Another Trip</button>
                </div>
            ) : !activePackage ? (
                <div className="glass-card">
                    <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Select a Package to Book</h2>
                    {packages.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No packages currently available.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {packages.map(pkg => (
                                <div key={pkg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.02)' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>{pkg.title}</h3>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{pkg.duration} mins • Base Price: ${pkg.price}</p>
                                    </div>
                                    <button className="btn btn-primary" onClick={() => setActivePackage(pkg)}>Select</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="glass-card">
                    <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>{activePackage.title}</h2>
                            <p style={{ color: 'var(--text-muted)' }}>{activePackage.description}</p>
                        </div>
                        <button className="btn btn-outline" style={{ padding: '0.5rem 1rem' }} onClick={() => setActivePackage(null)}>Change Tour</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>

                        {/* Dynamic Pricing Visualizer */}
                        <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <TrendingDown className="text-primary" /> Live Market Price
                                </h3>
                                <span className="text-muted" style={{ fontSize: '0.875rem' }}>Refreshes 3s</span>
                            </div>
                            <div style={{ fontSize: '3rem', fontWeight: '800', fontFamily: 'monospace', color: 'var(--secondary)' }}>
                                ${pricing.current} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>USDC</span>
                            </div>
                            {pricing.discount > 0 ? (
                                <div style={{ color: 'var(--secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                    ↓ {pricing.discount}% demand discount applied
                                </div>
                            ) : (
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                    Demand increasing...
                                </div>
                            )}
                        </div>

                        {/* Smart Contract Info */}
                        <div style={{ padding: '1.5rem', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '1rem', background: 'rgba(139, 92, 246, 0.05)' }}>
                            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <ShieldCheck className="text-accent" /> Verify Transaction
                            </h3>
                            <ul style={{ listStyle: 'none', color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <li><strong>Network:</strong> Ethereum L2 (Optimism)</li>
                                <li><strong>Gas Fee:</strong> ~ $0.002</li>
                                <li><strong>Duration:</strong> {activePackage.duration} mins</li>
                                <li><strong>Escrow:</strong> 100% automated refund if cancelled 48h prior</li>
                            </ul>
                        </div>
                    </div>

                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '1rem', fontSize: '1.25rem', display: 'flex', justifyContent: 'center' }}
                        onClick={handleSmartContractBooking}
                        disabled={isBooking}
                    >
                        {isBooking ? (
                            <><Clock className="icon-pulse" /> Confirming on Ledger...</>
                        ) : (
                            `Sign & Execute Booking - $${pricing.current}`
                        )}
                    </button>
                </div>
            )}
        </div>
    )
}
