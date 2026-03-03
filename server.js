import express from 'express';
import cors from 'cors';
import { v2 as cloudinary } from 'cloudinary';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { URL } from 'url';

dotenv.config({ path: '.env.local' });

const app = express();
app.use(cors());
app.use(express.json());

const cleanEnv = (val) => (val || "").replace(/['"]/g, "").trim();

// Priority: NEXT_PUBLIC_ > VITE_ > Hardcoded correct one from Vercel dash
const CLOUD_NAME = cleanEnv(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || 'dlq8lvl0n');
const API_KEY = cleanEnv(process.env.CLOUDINARY_API_KEY);
const API_SECRET = cleanEnv(process.env.CLOUDINARY_API_SECRET);

cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true
});

// Extra safety: Some versions of Cloudinary SDK better handle direct environment setting
process.env.CLOUDINARY_URL = `cloudinary://${API_KEY}:${API_SECRET}@${CLOUD_NAME}`;

let pool;
try {
    let dbUrl = process.env.DATABASE_URL;
    if (dbUrl && !dbUrl.includes('ssl=')) {
        dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'ssl={"rejectUnauthorized":true}';
    }
    pool = mysql.createPool(dbUrl);
} catch (err) {
    console.error('MySQL Pool Error:', err);
}

async function initDB() {
    if (!pool) return;
    try {
        const conn = await pool.getConnection();
        await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        clerk_id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255),
        is_blocked BOOLEAN DEFAULT FALSE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
        await conn.query(`
      CREATE TABLE IF NOT EXISTS photos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title TEXT NOT NULL,
        category VARCHAR(255),
        image_url TEXT NOT NULL,
        public_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        await conn.query(`
      CREATE TABLE IF NOT EXISTS downloads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        photo_id INT NOT NULL,
        downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        conn.release();
        console.log('TiDB Table initialized securely');
    } catch (error) {
        console.error('TiDB Init Error:', error.message);
    }
}
initDB().catch(() => { });

app.get('/api/users', async (req, res) => {
    try {
        const clerkRes = await fetch('https://api.clerk.com/v1/users?limit=100', {
            headers: { 'Authorization': `Bearer ${(process.env.CLERK_SECRET_KEY || "").trim()}` }
        });
        if (!clerkRes.ok) throw new Error('Clerk API failed: ' + await clerkRes.text());

        const clerkUsers = await clerkRes.json();
        let userStats = {};
        if (pool) {
            const [rows] = await pool.query('SELECT clerk_id, is_blocked, email FROM users');
            rows.forEach(r => userStats[r.clerk_id] = { isBlocked: r.is_blocked, email: r.email });
        }
        const users = clerkUsers.map(u => {
            const email = u.email_addresses && u.email_addresses[0] ? u.email_addresses[0].email_address : 'No Email';
            return {
                id: u.id,
                name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Anonymous',
                email: email,
                joinedAt: u.created_at,
                isBlocked: userStats[u.id] ? !!userStats[u.id].isBlocked : false
            };
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users/toggle', async (req, res) => {
    try {
        const { clerkId, isBlocked, email } = req.body;
        if (!pool) return res.status(500).json({ error: 'DB not connected' });

        await pool.query(
            'INSERT INTO users (clerk_id, is_blocked, email) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE is_blocked = ?, email = ?',
            [clerkId, isBlocked || false, email || '', isBlocked || false, email || '']
        );
        res.json({ success: true, isBlocked });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/status', async (req, res) => {
    try {
        const { clerkId } = req.query;
        if (!pool || !clerkId) return res.json({ isBlocked: false });
        const [rows] = await pool.query('SELECT is_blocked FROM users WHERE clerk_id = ?', [clerkId]);
        res.json({ isBlocked: rows.length > 0 ? !!rows[0].is_blocked : false });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/sign', async (req, res) => {
    try {
        const timestamp = Math.round(new Date().getTime() / 1000);
        const folder = 'portfolio';

        // Use Cloudinary SDK utility for signing to ensure correct parameter order and hashing
        // This is much safer than manual hashing
        const signature = cloudinary.utils.api_sign_request(
            { timestamp, folder },
            (process.env.CLOUDINARY_API_SECRET || "").trim()
        );

        res.json({
            timestamp,
            signature,
            apiKey: (process.env.CLOUDINARY_API_KEY || "").trim(),
            cloudName: (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || "").trim(),
            folder
        });
    } catch (error) {
        console.error('Signature Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/images', async (req, res) => {
    try {
        const { title, category, url, public_id } = req.body;
        if (!pool) return res.status(500).json({ error: 'Database not connected' });
        const [result] = await pool.query(
            'INSERT INTO photos (title, category, image_url, public_id) VALUES (?, ?, ?, ?)',
            [title, category || '', url, public_id]
        );
        res.json({ id: result.insertId, title, category, url, public_id });
    } catch (error) {
        console.error('Save Metadata Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/images', async (req, res) => {
    try {
        if (!pool) return res.json([]);
        const [rows] = await pool.query('SELECT id, title, category, image_url as url, public_id, created_at FROM photos ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/images/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!pool) return res.status(500).json({ error: 'DB not connected' });

        const [rows] = await pool.query('SELECT public_id FROM photos WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Image not found' });

        const publicId = rows[0].public_id;

        if (publicId) {
            const cloudRes = await cloudinary.uploader.destroy(publicId);
            if (cloudRes.result !== 'ok' && cloudRes.result !== 'not found') {
                return res.status(400).json({ error: cloudRes.error?.message || cloudRes.result });
            }
        }

        await pool.query('DELETE FROM photos WHERE id = ?', [id]);
        res.json({ success: true, deleted: id });
    } catch (error) {
        console.error('Delete Image Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/images/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, category } = req.body;
        if (!pool) return res.status(500).json({ error: 'DB not connected' });

        await pool.query(
            'UPDATE photos SET title = ?, category = ? WHERE id = ?',
            [title, category || '', id]
        );
        res.json({ success: true, updated: id });
    } catch (error) {
        console.error('Edit Image Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/analytics/track', async (req, res) => {
    try {
        const { userId, photoId } = req.body;
        if (!pool) return res.status(500).json({ error: 'DB not connected' });

        // Backend Verification: Check if user is blocked
        const [userRows] = await pool.query('SELECT is_blocked FROM users WHERE clerk_id = ?', [userId]);
        if (userRows.length > 0 && !!userRows[0].is_blocked) {
            return res.status(403).json({ error: 'Access Denied: User is blocked' });
        }

        await pool.query('INSERT INTO downloads (user_id, photo_id) VALUES (?, ?)', [userId, photoId]);
        res.json({ success: true });
    } catch (error) {
        console.error('Track Download Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/analytics', async (req, res) => {
    try {
        if (!pool) return res.json({ totalDownloads: 0, topPhotos: [], recentActivity: [] });

        const [totalRes] = await pool.query('SELECT COUNT(*) as count FROM downloads');
        const totalDownloads = totalRes[0].count;

        const [topRes] = await pool.query(`
            SELECT i.id, i.title, i.image_url as url, COUNT(d.id) as download_count 
            FROM downloads d 
            JOIN photos i ON d.photo_id = i.id 
            GROUP BY i.id 
            ORDER BY download_count DESC 
            LIMIT 5
        `);

        // Fetch Clerk Users mapping
        const clerkRes = await fetch('https://api.clerk.com/v1/users?limit=100', {
            headers: { 'Authorization': `Bearer ${(process.env.CLERK_SECRET_KEY || "").trim()}` }
        });
        const clerkUsers = clerkRes.ok ? await clerkRes.json() : [];
        const userMap = {};
        clerkUsers.forEach(u => {
            userMap[u.id] = `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Anonymous';
        });

        const [recentRes] = await pool.query(`
            SELECT d.user_id, i.title, d.downloaded_at 
            FROM downloads d 
            JOIN photos i ON d.photo_id = i.id 
            ORDER BY d.downloaded_at DESC 
            LIMIT 10
        `);

        const recentActivity = recentRes.map(row => ({
            userName: userMap[row.user_id] || 'Unknown User',
            photoTitle: row.title,
            timestamp: row.downloaded_at
        }));

        res.json({ totalDownloads, topPhotos: topRes, recentActivity });
    } catch (error) {
        console.error('Analytics Fetch Error:', error);
        res.status(500).json({ error: error.message });
    }
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const PORT = 5000;
    app.listen(PORT, () => {
        console.log(`Backend API running on http://localhost:${PORT}`);
    });
}

export default app;
