import React, { useState, useEffect } from 'react'
import { Navigation, Maximize2 } from 'lucide-react'

export default function VRTours() {
    const [activeTour, setActiveTour] = useState(null)
    const [tours, setTours] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchTours = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tours`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setTours(data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch tours from API:", err);
                setError(err);
                setLoading(false);
            }
        };

        fetchTours();
    }, []);

    const fallbackImages = {
        bora: 'https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        swiss: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        kyoto: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        default: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    };

    const getTourImage = (tour) => {
        if (tour.image_url) return tour.image_url;
        const title = (tour.title || '').toLowerCase();
        if (title.includes('bora')) return fallbackImages.bora;
        if (title.includes('swiss') || title.includes('alp')) return fallbackImages.swiss;
        if (title.includes('kyoto') || title.includes('temple')) return fallbackImages.kyoto;
        return fallbackImages.default;
    };

    if (loading) return <div className="container" style={{ textAlign: 'center', marginTop: '20vh' }}><h3>Loading VR Environments...</h3></div>;
    if (error) return <div className="container" style={{ color: '#ef4444', textAlign: 'center' }}><h3>System Error: {error.message}</h3></div>;

    return (
        <div className="container" style={{ padding: '2rem 5%' }}>
            <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h1 className="heading-xl">Immersive <span className="text-gradient">VR Tours</span></h1>
                <p style={{ color: 'var(--text-muted)' }}>Step into your destination before booking. Compatible with WebXR and mobile headsets.</p>
            </header>

            {activeTour ? (
                <div className="vr-viewer glass-card" style={{ position: 'relative', height: '600px', overflow: 'hidden', padding: 0 }}>
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundImage: `url(${getTourImage(activeTour)})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'brightness(0.6)',
                        transition: 'all 0.5s ease'
                    }}></div>

                    <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10 }}>
                        <button className="btn btn-outline" style={{ background: 'rgba(0,0,0,0.5)', borderColor: 'transparent' }} onClick={() => setActiveTour(null)}>
                            Exit VR
                        </button>
                    </div>

                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', zIndex: 10 }}>
                        <Maximize2 size={64} className="icon-pulse" style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1rem' }} />
                        <h2 style={{ fontSize: '2rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{activeTour.title}</h2>
                        <p style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{activeTour.description} (Simulation)</p>
                    </div>
                </div>
            ) : (
                <div className="grid-3">
                    {tours.map(tour => {
                        const img = getTourImage(tour);
                        return (
                        <div key={tour.id} className="glass-card" style={{ padding: 0, overflow: 'hidden', transition: 'transform 0.3s ease, box-shadow 0.3s ease', cursor: 'pointer' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(99,102,241,0.3)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
                        >
                            <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    backgroundImage: `url(${img})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    transition: 'transform 0.4s ease'
                                }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                />
                                <div style={{
                                    position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px',
                                    background: 'linear-gradient(to top, rgba(15,15,26,0.9), transparent)'
                                }} />
                                <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(99,102,241,0.85)', backdropFilter: 'blur(4px)', padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold', color: '#fff' }}>
                                    {tour.duration} min
                                </div>
                            </div>
                            <div style={{ padding: '1.2rem' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', color: 'var(--text-main)', lineHeight: 1.3 }}>{tour.title}</h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem', minHeight: '40px', lineHeight: 1.5 }}>{tour.description}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="text-gradient" style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>₹{Number(tour.price).toLocaleString('en-IN')}</span>
                                    <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => setActiveTour(tour)}>
                                        <Navigation size={15} /> Enter VR
                                    </button>
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>
            )}
        </div>
    )
}
