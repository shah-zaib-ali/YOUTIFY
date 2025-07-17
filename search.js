const express = require('express');
const app = express();
const db = require('./db'); // Assuming you have a db module to handle database operations

app.get('/api/search', async (req, res) => {
    const q = req.query.q;
    const limit = parseInt(req.query.limit) || 25;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    try {
        // Example with SQL:
        const results = await db.query('SELECT * FROM tracks WHERE title LIKE ? LIMIT ? OFFSET ?', [`%${q}%`, limit, offset]);
        res.json({ results });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching the data.' });
    }
});

module.exports = app;