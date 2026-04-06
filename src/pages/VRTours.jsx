import React, { useState, useEffect } from 'react'
import { Navigation, Maximize2 } from 'lucide-react'
import { useDuckDB } from '../hooks/useDuckDB'
import { initTables } from '../services/DuckDBService'

export default function VRTours() {
    const [activeTour, setActiveTour] = useState(null)
    const { connection, loading, error } = useDuckDB()
    const [tours, setTours] = useState([])

    useEffect(() => {
        if (!connection) return;

        const initDB = async () => {
            try {
                await initTables();

                const toursRes = await connection.query('SELECT * FROM tour_packages ORDER BY id DESC');
                setTours(toursRes.toArray().map(r => r.toJSON()));
            } catch (err) {
                console.error("Failed to fetch tours from DuckDB:", err);
            }
        };

        initDB();
    }, [connection]);

    const defaultImage = 'https://images.unsplash.com/photo-1502008479536-ee1b321420d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

    if (loading) return <div className="container" style={{ textAlign: 'center', marginTop: '20vh' }}><h3>Starting VR Environment...</h3></div>;
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
                        backgroundImage: `url(${defaultImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'brightness(0.7)'
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
                    {tours.map(tour => (
                        <div key={tour.id} className="glass-card" style={{ padding: '1rem' }}>
                            <div style={{
                                height: '200px',
                                borderRadius: '0.5rem',
                                backgroundImage: `url(${defaultImage})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                marginBottom: '1rem'
                            }}></div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.2rem' }}>{tour.title}</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.8rem', minHeight: '40px' }}>{tour.description}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <span className="text-gradient" style={{ fontWeight: 'bold' }}>${Number(tour.price).toFixed(2)}</span>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{tour.duration} mins</span>
                            </div>
                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setActiveTour(tour)}>
                                <Navigation size={18} /> Enter Tour
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
