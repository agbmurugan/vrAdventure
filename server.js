import express from "express";
import pkg from "pg";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
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

        const res = await pool.query("SELECT COUNT(*) FROM tour_packages;");
        const count = parseInt(res.rows[0].count, 10);

        if (count === 0) {
            await pool.query(`
                INSERT INTO tour_packages (title, description, price, duration) VALUES 
                ('Bora Bora Overwater Bungalows', 'Experience paradise in 360', 1200.00, 60),
                ('Swiss Alps Ski Resort', 'Virtual skiing experience', 850.00, 45),
                ('Kyoto Ancient Temples', 'Peaceful cherry blossom walk', 920.00, 120);
            `);
            console.log("Seeded tour_packages with default data.");
        }
        console.log("Database initialized successfully.");
    } catch (err) {
        console.error("Database initialization failed:", err);
    }
};

initDB();

// API ROUTES FOR TOUR PACKAGES

// Get all packages
app.get("/api/tours", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM tour_packages ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch tours" });
    }
});

// Create a package
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

// Update a package
app.put("/api/tours/:id", async (req, res) => {
    const { id } = req.params;
    const { title, description, price, duration } = req.body;
    try {
        const result = await pool.query(
            "UPDATE tour_packages SET title = $1, description = $2, price = $3, duration = $4 WHERE id = $5 RETURNING *",
            [title, description, price, duration, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Tour not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update tour" });
    }
});

// Delete a package
app.delete("/api/tours/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("DELETE FROM tour_packages WHERE id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Tour not found" });
        }
        res.json({ message: "Tour deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete tour" });
    }
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});