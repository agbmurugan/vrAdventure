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
        user: process.env.EMAIL_USER || 'foo@gmail.com',
        pass: process.env.EMAIL_PASS || 'password'
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
                duration INTEGER NOT NULL
            );
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
                INSERT INTO tour_packages (title, description, price, duration) VALUES 
                ('Bora Bora Overwater Bungalows', 'Experience paradise in 360', 1200.00, 60),
                ('Swiss Alps Ski Resort', 'Virtual skiing experience', 850.00, 45),
                ('Kyoto Ancient Temples', 'Peaceful cherry blossom walk', 920.00, 120);
            `);
            console.log("Seeded tour_packages with default data.");
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
    const { title, description, price, duration } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO tour_packages (title, description, price, duration) VALUES ($1, $2, $3, $4) RETURNING *",
            [title, description, price, duration]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create tour" });
    }
});

app.put("/api/tours/:id", async (req, res) => {
    const { id } = req.params;
    const { title, description, price, duration } = req.body;
    try {
        const result = await pool.query(
            "UPDATE tour_packages SET title = $1, description = $2, price = $3, duration = $4 WHERE id = $5 RETURNING *",
            [title, description, price, duration, id]
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

        // Validate duplicates
        const existing = await pool.query("SELECT * FROM tbl_users WHERE email = $1 OR phone = $2", [email, phone]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Email or phone already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        const result = await pool.query(
            "INSERT INTO tbl_users (name, email, password, phone, address, verification_code) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email",
            [name, email, hashedPassword, phone, address, verificationCode]
        );

        // Send Email
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER || 'no-reply@vradventure.com',
                to: email,
                subject: 'Verify your email - vrAdventure',
                text: `Your verification code is: ${verificationCode}`
            });
        } catch (mailErr) {
            console.error("Mail could not be sent (check .env):", mailErr.message);
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
                from: process.env.EMAIL_USER || 'no-reply@vradventure.com',
                to: email,
                subject: 'Password Reset - vrAdventure',
                text: `Your password reset code is: ${resetCode}. It expires in 15 minutes.`
            });
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

app.listen(5000, () => {
    console.log("Server running on port 5000");
});