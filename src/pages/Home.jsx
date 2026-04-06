import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Globe, Zap, ShieldCheck } from 'lucide-react'

export default function Home() {
    return (
        <div className="home-container">
            {/* Hero Section */}
            <section className="hero container" style={{
                minHeight: '80vh',
                display: 'flex',
                alignItems: 'center',
                paddingTop: '6rem'
            }}>
                <div style={{ maxWidth: '800px' }}>
                    <h1 className="heading-xl">
                        Experience the World in <br />
                        <span className="text-gradient">Limitless Dimensions</span>
                    </h1>
                    <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        Immersive VR tours, smart itineraries, and trustless bookings.
                        Elevate your travel before you even pack your bags.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Link to="/vr-tours" className="btn btn-primary">
                            Launch VR Tour <ArrowRight size={20} />
                        </Link>
                        <Link to="/booking" className="btn btn-outline">
                            Explore Destinations
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="features container">
                <h2 style={{ fontSize: '2.5rem', marginBottom: '3rem', textAlign: 'center' }}>
                    Next-Gen <span className="text-gradient">Travel Tech</span>
                </h2>
                <div className="grid-3">
                    <div className="glass-card">
                        <Globe className="text-primary" size={48} style={{ marginBottom: '1.5rem' }} />
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Immersive VR/AR</h3>
                        <p style={{ color: 'var(--text-muted)' }}>
                            Explore destinations in rich 360-degree virtual reality environments to test-drive your next adventure.
                        </p>
                    </div>
                    <div className="glass-card">
                        <Zap className="text-primary" size={48} style={{ marginBottom: '1.5rem' }} />
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Smart Algorithms</h3>
                        <p style={{ color: 'var(--text-muted)' }}>
                            Dynamic pricing and AI-driven personalized itineraries tailored exactly to your preferences and dates.
                        </p>
                    </div>
                    <div className="glass-card">
                        <ShieldCheck className="text-primary" size={48} style={{ marginBottom: '1.5rem' }} />
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Blockchain Bookings</h3>
                        <p style={{ color: 'var(--text-muted)' }}>
                            Secure, transparent, and trustless interactions using smart contracts for peace-of-mind transactions.
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer Placeholder for visual completion */}
            <footer style={{ marginTop: '5rem', padding: '3rem 5%', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ color: 'var(--text-muted)' }}>© 2026 vrAdventure. Empowering the sustainable explorer.</p>
            </footer>
        </div>
    )
}
