import express from "express";
import pkg from "pg";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

dotenv.config();

const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
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

// Database Initialization
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

        // Add image_url column if it doesn't exist (for existing databases)
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

        const resTours = await pool.query("SELECT COUNT(*) FROM tour_packages;");
        if (parseInt(resTours.rows[0].count, 10) === 0) {
            await pool.query(`
                INSERT INTO tour_packages (title, description, price, duration, image_url) VALUES 
                ('Bora Bora Overwater Bungalows', 'Experience paradise in 360° — float above turquoise lagoons in luxury overwater villas.', 1200.00, 60, 'https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'),
                ('Swiss Alps Ski Resort', 'Virtual skiing on pristine powder — glide down legendary slopes with breathtaking alpine panoramas.', 850.00, 45, 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'),
                ('Kyoto Ancient Temples', 'Walk through centuries of Japanese culture — cherry blossoms, zen gardens, and tranquil shrines await.', 920.00, 120, 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80');
            `);
            console.log("Seeded tour_packages with default data.");
        } else {
            // Update existing tours with images if image_url is still null
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

// API ROUTES FOR TOUR PACKAGES
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


// AUTH ROUTES
app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password, phone, address } = req.body;
    try {
        if (!name || !email || !password || !phone) {
            return res.status(400).json({ error: 'Name, email, password, and phone are required' });
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if email already exists
        const byEmail = await pool.query("SELECT * FROM tbl_users WHERE email = $1", [email]);

        if (byEmail.rows.length > 0) {
            const existingUser = byEmail.rows[0];

            // Already verified → block
            if (existingUser.is_verified) {
                return res.status(409).json({ error: 'This email is already registered and verified. Please login.' });
            }

            // Not verified → check if the phone is taken by a DIFFERENT verified user
            const phoneConflict = await pool.query(
                "SELECT * FROM tbl_users WHERE phone = $1 AND email != $2 AND is_verified = true",
                [phone, email]
            );
            if (phoneConflict.rows.length > 0) {
                return res.status(409).json({ error: 'This phone number is already in use by another account.' });
            }

            // Update the unverified account with new details + fresh code
            await pool.query(
                `UPDATE tbl_users 
                 SET name = $1, password = $2, phone = $3, address = $4, verification_code = $5
                 WHERE email = $6`,
                [name, hashedPassword, phone, address, verificationCode, email]
            );
            console.log(`Updated unverified user: ${email} — new code issued.`);

        } else {
            // Phone check: is phone taken by any verified user?
            const phoneCheck = await pool.query(
                "SELECT * FROM tbl_users WHERE phone = $1 AND is_verified = true",
                [phone]
            );
            if (phoneCheck.rows.length > 0) {
                return res.status(409).json({ error: 'This phone number is already in use.' });
            }

            // Brand new user — also clean up any old unverified record with same phone
            await pool.query(
                "DELETE FROM tbl_users WHERE phone = $1 AND is_verified = false",
                [phone]
            );

            // Insert fresh
            await pool.query(
                "INSERT INTO tbl_users (name, email, password, phone, address, verification_code) VALUES ($1, $2, $3, $4, $5, $6)",
                [name, email, hashedPassword, phone, address, verificationCode]
            );
        }

        // Send Email
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
            // Still succeed user creation but warn client mail failed
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
        // We also check username here to allow backward compatibility for 'admin'/'user' if needed
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

        res.json({ message: 'Logged in successfully', token, role: user.role });
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
        const expires = new Date(Date.now() + 15 * 60000); // 15 minutes from now

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

// ADMIN ROUTES (User Management)
app.get('/api/users', async (req, res) => {
    // In production, you would add a middleware to check JWT & that role === 'admin'
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

// ─── DEBUG: Test Email Route ─────────────────────────────────────────────────
// Visit: GET /api/test-email?to=youremail@gmail.com
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