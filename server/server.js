import express from "express";
import pkg from "pg";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dns from "dns";

dotenv.config();

// Force IPv4 for external connections (fixes ESOCKET ENETUNREACH on platforms like Railway/Vercel)
dns.setDefaultResultOrder('ipv4first');

const { Pool } = pkg;

const app = express();
app.use(cors({
    origin: ["https://vr-adventure.vercel.app", "http://localhost:5173", "http://localhost:5174"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"]
}));
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Port 587 uses STARTTLS
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 20000,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify SMTP connection on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('\n❌ SMTP CONNECTION FAILED:');
        console.error('   Code   :', error.code);
        console.error('   Message:', error.message);
        console.error('   EMAIL_USER set:', !!process.env.EMAIL_USER);
        console.error('   EMAIL_PASS set:', !!process.env.EMAIL_PASS);
        console.error('   Tip: Use a Gmail App Password (not your real password)');
        console.error('   Tip: https://myaccount.google.com/apppasswords\n');
    } else {
        console.log('✅ SMTP connection verified — Gmail is ready to send emails.');
    }
});

// ─── JWT Auth Middleware ─────────────────────────────────────────────────────
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// ─── Email Templates ─────────────────────────────────────────────────────────
const sendUserBookingConfirmation = async (userEmail, userName, tourTitle, tourDate, price, bookingId) => {
    const formatted = new Date(tourDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    await transporter.sendMail({
        from: `"vrAdventure" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `🎉 Booking Confirmed — ${tourTitle} | vrAdventure`,
        text: `Hi ${userName}, your booking for ${tourTitle} on ${formatted} has been confirmed! Booking ID: #${bookingId}`,
        html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;background:#0f0f1a;color:#e2e8f0;padding:40px 20px;min-height:100vh">
          <div style="max-width:520px;margin:0 auto;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;overflow:hidden">
            <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899);padding:36px;text-align:center">
              <div style="font-size:3rem;margin-bottom:8px">✈️</div>
              <h1 style="margin:0;font-size:1.8rem;color:#fff;letter-spacing:-0.5px">Booking Confirmed!</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:0.95rem">vrAdventure — Your Journey Awaits</p>
            </div>
            <div style="padding:32px">
              <p style="margin:0 0 20px;color:#94a3b8;line-height:1.7;font-size:1rem">Hi <strong style="color:#e2e8f0">${userName}</strong>,<br/>
              We're thrilled to confirm your VR adventure booking! Get ready for an incredible experience. 🌍</p>

              <div style="background:linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1));border:1px solid rgba(99,102,241,0.3);border-radius:12px;padding:24px;margin-bottom:24px">
                <h2 style="margin:0 0 16px;font-size:1.2rem;color:#a5b4fc;border-bottom:1px solid rgba(99,102,241,0.2);padding-bottom:10px">📋 Booking Details</h2>
                <table style="width:100%;border-collapse:collapse">
                  <tr>
                    <td style="padding:8px 0;color:#64748b;font-size:0.9rem">Booking ID</td>
                    <td style="padding:8px 0;color:#e2e8f0;font-weight:bold;text-align:right">#${bookingId}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#64748b;font-size:0.9rem">Tour Package</td>
                    <td style="padding:8px 0;color:#a5b4fc;font-weight:bold;text-align:right">${tourTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#64748b;font-size:0.9rem">Travel Date</td>
                    <td style="padding:8px 0;color:#e2e8f0;font-weight:bold;text-align:right">📅 ${formatted}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#64748b;font-size:0.9rem">Amount Paid</td>
                    <td style="padding:8px 0;color:#34d399;font-weight:bold;text-align:right;font-size:1.1rem">₹${price}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#64748b;font-size:0.9rem">Status</td>
                    <td style="padding:8px 0;text-align:right"><span style="background:rgba(52,211,153,0.15);color:#34d399;padding:3px 10px;border-radius:20px;font-size:0.85rem">✓ Confirmed</span></td>
                  </tr>
                </table>
              </div>

              <div style="background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.2);border-radius:10px;padding:16px;margin-bottom:24px">
                <p style="margin:0;color:#fbbf24;font-size:0.9rem">⏰ <strong>Reminder:</strong> Be ready on your travel date! Log in to vrAdventure to manage your bookings and view your complete itinerary.</p>
              </div>

              <p style="margin:0;color:#64748b;font-size:0.85rem;line-height:1.6">If you have any questions, please contact our support team. We're here to make your adventure unforgettable!</p>
            </div>
            <div style="background:rgba(255,255,255,0.03);border-top:1px solid rgba(255,255,255,0.07);padding:16px;text-align:center">
              <p style="margin:0;color:#475569;font-size:0.8rem">© 2025 vrAdventure · Built with ❤️ for explorers</p>
            </div>
          </div>
        </div>`
    });
};

const sendAdminBookingNotification = async (adminEmail, userName, userEmail, userPhone, tourTitle, tourDate, price, bookingId) => {
    const formatted = new Date(tourDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    await transporter.sendMail({
        from: `"vrAdventure System" <${process.env.EMAIL_USER}>`,
        to: adminEmail,
        subject: `🔔 New Booking Alert — ${tourTitle} by ${userName}`,
        text: `New booking from ${userName} (${userEmail}) for ${tourTitle} on ${formatted}. Booking ID: #${bookingId}`,
        html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;background:#0f0f1a;color:#e2e8f0;padding:40px 20px;min-height:100vh">
          <div style="max-width:520px;margin:0 auto;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;overflow:hidden">
            <div style="background:linear-gradient(135deg,#f97316,#ef4444);padding:36px;text-align:center">
              <div style="font-size:3rem;margin-bottom:8px">🔔</div>
              <h1 style="margin:0;font-size:1.8rem;color:#fff;letter-spacing:-0.5px">New Booking Alert</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:0.95rem">vrAdventure Admin Notification</p>
            </div>
            <div style="padding:32px">
              <p style="margin:0 0 20px;color:#94a3b8;line-height:1.7;font-size:1rem">A new booking has been made on the vrAdventure platform. Here are the complete details:</p>

              <div style="background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.25);border-radius:12px;padding:24px;margin-bottom:20px">
                <h2 style="margin:0 0 14px;font-size:1.1rem;color:#fb923c;border-bottom:1px solid rgba(249,115,22,0.2);padding-bottom:10px">👤 Customer Details</h2>
                <table style="width:100%;border-collapse:collapse">
                  <tr>
                    <td style="padding:7px 0;color:#64748b;font-size:0.9rem">Name</td>
                    <td style="padding:7px 0;color:#e2e8f0;font-weight:bold;text-align:right">${userName}</td>
                  </tr>
                  <tr>
                    <td style="padding:7px 0;color:#64748b;font-size:0.9rem">Email</td>
                    <td style="padding:7px 0;color:#fb923c;text-align:right">${userEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding:7px 0;color:#64748b;font-size:0.9rem">Phone</td>
                    <td style="padding:7px 0;color:#e2e8f0;text-align:right">${userPhone || 'N/A'}</td>
                  </tr>
                </table>
              </div>

              <div style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.25);border-radius:12px;padding:24px;margin-bottom:20px">
                <h2 style="margin:0 0 14px;font-size:1.1rem;color:#a5b4fc;border-bottom:1px solid rgba(99,102,241,0.2);padding-bottom:10px">📦 Booking Details</h2>
                <table style="width:100%;border-collapse:collapse">
                  <tr>
                    <td style="padding:7px 0;color:#64748b;font-size:0.9rem">Booking ID</td>
                    <td style="padding:7px 0;color:#e2e8f0;font-weight:bold;text-align:right">#${bookingId}</td>
                  </tr>
                  <tr>
                    <td style="padding:7px 0;color:#64748b;font-size:0.9rem">Tour Package</td>
                    <td style="padding:7px 0;color:#a5b4fc;font-weight:bold;text-align:right">${tourTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding:7px 0;color:#64748b;font-size:0.9rem">Travel Date</td>
                    <td style="padding:7px 0;color:#e2e8f0;font-weight:bold;text-align:right">📅 ${formatted}</td>
                  </tr>
                  <tr>
                    <td style="padding:7px 0;color:#64748b;font-size:0.9rem">Amount</td>
                    <td style="padding:7px 0;color:#34d399;font-weight:bold;text-align:right;font-size:1.1rem">₹${price}</td>
                  </tr>
                  <tr>
                    <td style="padding:7px 0;color:#64748b;font-size:0.9rem">Booked On</td>
                    <td style="padding:7px 0;color:#e2e8f0;text-align:right">${new Date().toLocaleString()}</td>
                  </tr>
                </table>
              </div>

              <p style="margin:0;color:#64748b;font-size:0.85rem;line-height:1.6">Login to the Admin Dashboard to manage this booking and view all bookings.</p>
            </div>
            <div style="background:rgba(255,255,255,0.03);border-top:1px solid rgba(255,255,255,0.07);padding:16px;text-align:center">
              <p style="margin:0;color:#475569;font-size:0.8rem">© 2025 vrAdventure Admin System</p>
            </div>
          </div>
        </div>`
    });
};

// ─── Database Initialization ──────────────────────────────────────────────────
const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tour_packages (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                price DOUBLE PRECISION NOT NULL,
                duration INTEGER NOT NULL,
                image_url TEXT
            );
        `);

        await pool.query(`
            ALTER TABLE tour_packages ADD COLUMN IF NOT EXISTS image_url TEXT;
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS tbl_users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                phone VARCHAR(50) UNIQUE,
                address TEXT,
                role VARCHAR(50) DEFAULT 'user',
                status VARCHAR(50) DEFAULT 'active',
                verification_code VARCHAR(100),
                is_verified BOOLEAN DEFAULT false,
                reset_code VARCHAR(100),
                reset_code_expires TIMESTAMP
            );
        `);

        // Create bookings table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tbl_bookings (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES tbl_users(id) ON DELETE SET NULL,
                tour_id INTEGER REFERENCES tour_packages(id) ON DELETE SET NULL,
                user_name VARCHAR(255) NOT NULL,
                user_email VARCHAR(255) NOT NULL,
                user_phone VARCHAR(50),
                tour_title VARCHAR(255) NOT NULL,
                tour_date DATE NOT NULL,
                price_paid DOUBLE PRECISION NOT NULL,
                status VARCHAR(50) DEFAULT 'upcoming',
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Migration: Ensure all columns exist in tbl_bookings (for older database versions)
        const bookingColumns = [
            { name: 'user_name', type: 'VARCHAR(255) NOT NULL DEFAULT \'Guest\'' },
            { name: 'user_email', type: 'VARCHAR(255) NOT NULL DEFAULT \'no-reply@example.com\'' },
            { name: 'user_phone', type: 'VARCHAR(50)' },
            { name: 'tour_title', type: 'VARCHAR(255) NOT NULL DEFAULT \'Trip\'' }
        ];

        for (const col of bookingColumns) {
            await pool.query(`ALTER TABLE tbl_bookings ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`);
        }

        const resTours = await pool.query("SELECT COUNT(*) FROM tour_packages;");
        if (parseInt(resTours.rows[0].count, 10) === 0) {
            await pool.query(`
                INSERT INTO tour_packages (title, description, price, duration, image_url) VALUES 
                ('Bora Bora Overwater Bungalows', 'Experience paradise in 360° — float above turquoise lagoons in luxury overwater villas.', 95000.00, 60, 'https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'),
                ('Swiss Alps Ski Resort', 'Virtual skiing on pristine powder — glide down legendary slopes with breathtaking alpine panoramas.', 72000.00, 45, 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'),
                ('Kyoto Ancient Temples', 'Walk through centuries of Japanese culture — cherry blossoms, zen gardens, and tranquil shrines await.', 68000.00, 120, 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80');
            `);
            console.log("Seeded tour_packages with default data.");
        } else {
            await pool.query(`
                UPDATE tour_packages SET image_url = 'https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                WHERE image_url IS NULL AND title ILIKE '%Bora Bora%';
            `);
            await pool.query(`
                UPDATE tour_packages SET image_url = 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                WHERE image_url IS NULL AND title ILIKE '%Swiss Alps%';
            `);
            await pool.query(`
                UPDATE tour_packages SET image_url = 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                WHERE image_url IS NULL AND title ILIKE '%Kyoto%';
            `);
            console.log("Updated existing tour images.");
        }

        const resUsers = await pool.query("SELECT COUNT(*) FROM tbl_users;");
        if (parseInt(resUsers.rows[0].count, 10) === 0) {
            const adminHash = await bcrypt.hash("admin", 10);
            const userHash = await bcrypt.hash("user", 10);
            await pool.query(`
                INSERT INTO tbl_users (name, email, password, role, is_verified, phone) VALUES 
                ('Admin User', 'admin@example.com', $1, 'admin', true, '0000000000'),
                ('Test User', 'user@example.com', $2, 'user', true, '1111111111');
            `, [adminHash, userHash]);
            console.log("Seeded tbl_users with default admin and user.");
        }

        console.log("Database initialized successfully.");
    } catch (err) {
        console.error("Database initialization failed:", err);
    }
};

initDB();

// ─── TOUR PACKAGE ROUTES ──────────────────────────────────────────────────────
app.get("/api/tours", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM tour_packages ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch tours" });
    }
});

app.post("/api/tours", async (req, res) => {
    const { title, description, price, duration, image_url } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO tour_packages (title, description, price, duration, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [title, description, price, duration, image_url || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create tour" });
    }
});

app.put("/api/tours/:id", async (req, res) => {
    const { id } = req.params;
    const { title, description, price, duration, image_url } = req.body;
    try {
        const result = await pool.query(
            "UPDATE tour_packages SET title = $1, description = $2, price = $3, duration = $4, image_url = $5 WHERE id = $6 RETURNING *",
            [title, description, price, duration, image_url || null, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: "Tour not found" });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update tour" });
    }
});

app.delete("/api/tours/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("DELETE FROM tour_packages WHERE id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: "Tour not found" });
        res.json({ message: "Tour deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete tour" });
    }
});


// ─── BOOKING ROUTES ───────────────────────────────────────────────────────────

// POST /api/bookings — Create a booking (requires auth)
app.post('/api/bookings', authenticateToken, async (req, res) => {
    const { tour_id, tour_date, price_paid } = req.body;
    const { id: user_id, name: user_name, email: user_email } = req.user;

    if (!tour_id || !tour_date || !price_paid) {
        return res.status(400).json({ error: 'tour_id, tour_date, and price_paid are required' });
    }

    try {
        // Get tour details
        const tourResult = await pool.query("SELECT * FROM tour_packages WHERE id = $1", [tour_id]);
        if (tourResult.rows.length === 0) return res.status(404).json({ error: 'Tour not found' });
        const tour = tourResult.rows[0];

        // Get user's phone
        const userResult = await pool.query("SELECT phone FROM tbl_users WHERE id = $1", [user_id]);
        const user_phone = userResult.rows[0]?.phone || null;

        // Insert booking
        const bookingResult = await pool.query(
            `INSERT INTO tbl_bookings (user_id, tour_id, user_name, user_email, user_phone, tour_title, tour_date, price_paid, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'upcoming') RETURNING *`,
            [user_id, tour_id, user_name, user_email, user_phone, tour.title, tour_date, price_paid]
        );
        const booking = bookingResult.rows[0];

        // Auto-update status to 'completed' if tour date is in the past
        await pool.query(`
            UPDATE tbl_bookings SET status = 'completed'
            WHERE status = 'upcoming' AND tour_date < CURRENT_DATE
        `);

        // Send user confirmation email
        try {
            await sendUserBookingConfirmation(user_email, user_name, tour.title, tour_date, price_paid, booking.id);
            console.log(`✅ Booking confirmation email sent to ${user_email}`);
        } catch (mailErr) {
            console.error('User booking email failed:', mailErr.message);
        }

        // Send admin notification email
        try {
            const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
            await sendAdminBookingNotification(adminEmail, user_name, user_email, user_phone, tour.title, tour_date, price_paid, booking.id);
            console.log(`✅ Admin notification email sent to ${adminEmail}`);
        } catch (mailErr) {
            console.error('Admin notification email failed:', mailErr.message);
        }

        res.status(201).json({
            message: 'Booking confirmed! A confirmation email has been sent to your email address.',
            booking
        });
    } catch (err) {
        console.error('Booking error:', err);
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

// GET /api/bookings/my — Get current user's bookings (requires auth)
app.get('/api/bookings/my', authenticateToken, async (req, res) => {
    try {
        // Auto-update expired upcoming bookings to completed
        await pool.query(`
            UPDATE tbl_bookings SET status = 'completed'
            WHERE status = 'upcoming' AND tour_date < CURRENT_DATE
        `);

        const result = await pool.query(
            `SELECT b.*, tp.image_url, tp.duration
             FROM tbl_bookings b
             LEFT JOIN tour_packages tp ON b.tour_id = tp.id
             WHERE b.user_id = $1
             ORDER BY b.tour_date DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// GET /api/bookings — Admin: get all bookings
app.get('/api/bookings', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    try {
        // Auto-update expired upcoming bookings to completed
        await pool.query(`
            UPDATE tbl_bookings SET status = 'completed'
            WHERE status = 'upcoming' AND tour_date < CURRENT_DATE
        `);

        const result = await pool.query(
            `SELECT b.*, tp.image_url, tp.duration
             FROM tbl_bookings b
             LEFT JOIN tour_packages tp ON b.tour_id = tp.id
             ORDER BY b.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch all bookings' });
    }
});

// GET /api/bookings/stats — Admin: booking stats
app.get('/api/bookings/stats', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    try {
        const total = await pool.query("SELECT COUNT(*) FROM tbl_bookings");
        const upcoming = await pool.query("SELECT COUNT(*) FROM tbl_bookings WHERE status = 'upcoming'");
        const completed = await pool.query("SELECT COUNT(*) FROM tbl_bookings WHERE status = 'completed'");
        const revenue = await pool.query("SELECT SUM(price_paid) FROM tbl_bookings");
        const recent = await pool.query(
            "SELECT COUNT(*) FROM tbl_bookings WHERE created_at > NOW() - INTERVAL '24 hours'"
        );
        res.json({
            total: parseInt(total.rows[0].count),
            upcoming: parseInt(upcoming.rows[0].count),
            completed: parseInt(completed.rows[0].count),
            revenue: parseFloat(revenue.rows[0].sum || 0).toFixed(2),
            recent24h: parseInt(recent.rows[0].count)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// PUT /api/bookings/:id/status — Update booking status (admin)
app.put('/api/bookings/:id/status', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { id } = req.params;
    const { status } = req.body;
    if (!['upcoming', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    try {
        const result = await pool.query(
            "UPDATE tbl_bookings SET status = $1 WHERE id = $2 RETURNING *",
            [status, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
        res.json({ message: 'Booking status updated', booking: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update booking status' });
    }
});


// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────
app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password, phone, address } = req.body;
    try {
        if (!name || !email || !password || !phone) {
            return res.status(400).json({ error: 'Name, email, password, and phone are required' });
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedPassword = await bcrypt.hash(password, 10);

        const byEmail = await pool.query("SELECT * FROM tbl_users WHERE email = $1", [email]);

        if (byEmail.rows.length > 0) {
            const existingUser = byEmail.rows[0];

            if (existingUser.is_verified) {
                return res.status(409).json({ error: 'This email is already registered and verified. Please login.' });
            }

            const phoneConflict = await pool.query(
                "SELECT * FROM tbl_users WHERE phone = $1 AND email != $2 AND is_verified = true",
                [phone, email]
            );
            if (phoneConflict.rows.length > 0) {
                return res.status(409).json({ error: 'This phone number is already in use by another account.' });
            }

            await pool.query(
                `UPDATE tbl_users 
                 SET name = $1, password = $2, phone = $3, address = $4, verification_code = $5
                 WHERE email = $6`,
                [name, hashedPassword, phone, address, verificationCode, email]
            );
            console.log(`Updated unverified user: ${email} — new code issued.`);

        } else {
            const phoneCheck = await pool.query(
                "SELECT * FROM tbl_users WHERE phone = $1 AND is_verified = true",
                [phone]
            );
            if (phoneCheck.rows.length > 0) {
                return res.status(409).json({ error: 'This phone number is already in use.' });
            }

            await pool.query(
                "DELETE FROM tbl_users WHERE phone = $1 AND is_verified = false",
                [phone]
            );

            await pool.query(
                "INSERT INTO tbl_users (name, email, password, phone, address, verification_code) VALUES ($1, $2, $3, $4, $5, $6)",
                [name, email, hashedPassword, phone, address, verificationCode]
            );
        }

        try {
            await transporter.sendMail({
                from: `"vrAdventure" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: '🌍 Verify your Email — vrAdventure',
                text: `Your verification code is: ${verificationCode}. Enter this code on the verification page to activate your account.`,
                html: `
                <div style="font-family:'Segoe UI',Arial,sans-serif;background:#0f0f1a;color:#e2e8f0;padding:40px 20px;min-height:100vh">
                  <div style="max-width:480px;margin:0 auto;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;overflow:hidden">
                    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:30px;text-align:center">
                      <h1 style="margin:0;font-size:1.8rem;color:#fff;letter-spacing:-0.5px">🌍 vrAdventure</h1>
                      <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:0.95rem">Your gateway to immersive VR travel</p>
                    </div>
                    <div style="padding:32px">
                      <h2 style="margin:0 0 12px;font-size:1.3rem;color:#a5b4fc">Verify your email address</h2>
                      <p style="margin:0 0 24px;color:#94a3b8;line-height:1.6">Welcome aboard! Use the code below to verify your email and start exploring the world in VR.</p>
                      <div style="background:rgba(99,102,241,0.15);border:2px dashed rgba(99,102,241,0.4);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
                        <div style="font-size:2.5rem;font-weight:800;letter-spacing:0.5rem;color:#a5b4fc;font-family:monospace">${verificationCode}</div>
                        <p style="margin:8px 0 0;color:#64748b;font-size:0.85rem">This code expires in 24 hours</p>
                      </div>
                      <p style="margin:0;color:#64748b;font-size:0.85rem;line-height:1.6">If you didn't sign up for vrAdventure, you can safely ignore this email.</p>
                    </div>
                    <div style="background:rgba(255,255,255,0.03);border-top:1px solid rgba(255,255,255,0.07);padding:16px;text-align:center">
                      <p style="margin:0;color:#475569;font-size:0.8rem">© 2025 vrAdventure · Built with ❤️ for explorers</p>
                    </div>
                  </div>
                </div>`
            });
            console.log("Verification email sent to:", email);
        } catch (mailErr) {
            console.error("Mail could not be sent:", mailErr.code, mailErr.message);
            return res.status(201).json({
                message: 'User created successfully. Please verify your email.',
                mail_warning: `Email delivery failed: ${mailErr.code || ''} ${mailErr.message}. Check Railway env vars EMAIL_USER and EMAIL_PASS.`
            });
        }

        res.status(201).json({ message: 'User created successfully. Please verify your email.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during signup' });
    }
});

app.post('/api/auth/verify', async (req, res) => {
    const { email, code } = req.body;
    try {
        const user = await pool.query("SELECT * FROM tbl_users WHERE email = $1", [email]);
        if (user.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        if (user.rows[0].verification_code === code) {
            await pool.query("UPDATE tbl_users SET is_verified = true, verification_code = null WHERE email = $1", [email]);
            return res.json({ message: 'Email verified successfully' });
        } else {
            return res.status(400).json({ error: 'Invalid verification code' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Server error during verification' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query("SELECT * FROM tbl_users WHERE email = $1 OR name = $1", [email]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = result.rows[0];

        if (user.status !== 'active') {
            return res.status(403).json({ error: 'Account is inactive. Contact administrator.' });
        }

        if (!user.is_verified) {
            return res.status(403).json({ error: 'Please verify your email first', requires_verification: true });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.id, role: user.role, name: user.name, email: user.email },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Logged in successfully',
            token,
            role: user.role,
            name: user.name,
            email: user.email
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during login' });
    }
});

app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await pool.query("SELECT * FROM tbl_users WHERE email = $1", [email]);
        if (user.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 15 * 60000);

        await pool.query("UPDATE tbl_users SET reset_code = $1, reset_code_expires = $2 WHERE email = $3", [resetCode, expires, email]);

        try {
            await transporter.sendMail({
                from: `"vrAdventure" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: '🔑 Password Reset Code — vrAdventure',
                text: `Your password reset code is: ${resetCode}. It expires in 15 minutes.`,
                html: `
                <div style="font-family:'Segoe UI',Arial,sans-serif;background:#0f0f1a;color:#e2e8f0;padding:40px 20px;min-height:100vh">
                  <div style="max-width:480px;margin:0 auto;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;overflow:hidden">
                    <div style="background:linear-gradient(135deg,#ef4444,#f97316);padding:30px;text-align:center">
                      <h1 style="margin:0;font-size:1.8rem;color:#fff;letter-spacing:-0.5px">🔑 Password Reset</h1>
                      <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:0.95rem">vrAdventure Security</p>
                    </div>
                    <div style="padding:32px">
                      <h2 style="margin:0 0 12px;font-size:1.3rem;color:#fca5a5">Reset your password</h2>
                      <p style="margin:0 0 24px;color:#94a3b8;line-height:1.6">Use the code below to reset your password. This code is valid for <strong style="color:#f87171">15 minutes only</strong>.</p>
                      <div style="background:rgba(239,68,68,0.1);border:2px dashed rgba(239,68,68,0.4);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
                        <div style="font-size:2.5rem;font-weight:800;letter-spacing:0.5rem;color:#fca5a5;font-family:monospace">${resetCode}</div>
                        <p style="margin:8px 0 0;color:#64748b;font-size:0.85rem">⏳ Expires in 15 minutes</p>
                      </div>
                      <p style="margin:0;color:#64748b;font-size:0.85rem;line-height:1.6">If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
                    </div>
                    <div style="background:rgba(255,255,255,0.03);border-top:1px solid rgba(255,255,255,0.07);padding:16px;text-align:center">
                      <p style="margin:0;color:#475569;font-size:0.8rem">© 2025 vrAdventure · Built with ❤️ for explorers</p>
                    </div>
                  </div>
                </div>`
            });
            console.log("Password reset email sent to:", email);
        } catch (mailErr) {
            console.error("Mail could not be sent (check .env):", mailErr.message);
        }

        res.json({ message: 'Password reset code sent to your email.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/reset-password', async (req, res) => {
    const { email, code, newPassword } = req.body;
    try {
        const user = await pool.query("SELECT * FROM tbl_users WHERE email = $1 AND reset_code = $2", [email, code]);
        if (user.rows.length === 0) return res.status(400).json({ error: 'Invalid code or email' });

        if (new Date() > new Date(user.rows[0].reset_code_expires)) {
            return res.status(400).json({ error: 'Reset code expired' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query("UPDATE tbl_users SET password = $1, reset_code = null, reset_code_expires = null WHERE email = $2", [hashedPassword, email]);

        res.json({ message: 'Password reset successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── ADMIN ROUTES (User Management) ──────────────────────────────────────────
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query("SELECT id, name, email, phone, address, role, status, is_verified FROM tbl_users ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.put('/api/users/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const result = await pool.query("UPDATE tbl_users SET status = $1 WHERE id = $2 RETURNING id, name, status", [status, id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User status updated', user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// ─── DEBUG: Test Email Route ───────────────────────────────────────────────────
app.get('/api/test-email', async (req, res) => {
    const to = req.query.to || process.env.EMAIL_USER;
    if (!to) return res.status(400).json({ error: 'Provide ?to=email in query' });

    const diagnostics = {
        EMAIL_USER_set: !!process.env.EMAIL_USER,
        EMAIL_PASS_set: !!process.env.EMAIL_PASS,
        EMAIL_USER_value: process.env.EMAIL_USER || '(not set)',
        sending_to: to
    };

    try {
        await transporter.sendMail({
            from: `"vrAdventure Test" <${process.env.EMAIL_USER}>`,
            to,
            subject: '✅ vrAdventure — SMTP Test Email',
            text: 'This is a test email from vrAdventure server. If you received this, email is working!',
            html: `
            <div style="font-family:Arial,sans-serif;padding:30px;background:#1e1e2e;color:#cdd6f4;border-radius:12px;max-width:400px;margin:auto">
              <h2 style="color:#a6e3a1;margin-bottom:12px">✅ Email is working!</h2>
              <p style="color:#bac2de">This test was sent from your vrAdventure Railway server.</p>
              <pre style="background:#313244;padding:12px;border-radius:8px;font-size:0.85rem;color:#cba6f7">${JSON.stringify(diagnostics, null, 2)}</pre>
            </div>`
        });
        res.json({ success: true, message: `Test email sent to ${to}`, diagnostics });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
            code: err.code,
            diagnostics,
            fix: [
                '1. Make sure EMAIL_USER and EMAIL_PASS are set in Railway environment variables',
                '2. Gmail requires a 16-character App Password (not your normal password)',
                '3. Generate one at: https://myaccount.google.com/apppasswords',
                '4. Enable 2-Step Verification on your Google account first'
            ]
        });
    }
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});