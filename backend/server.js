// server.js
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Initialize SQLite database
const db = new sqlite3.Database('./wesley_eoi.db');
db.run(`
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT,
    gradYear TEXT,
    email TEXT,
    phone TEXT,
    occupation TEXT,
    positions TEXT,
    positionOther TEXT,
    motivation TEXT,
    experience TEXT,
    commitment TEXT,
    meetings TEXT,
    declaration INTEGER,
    signature TEXT,
    date TEXT,
    createdAt TEXT
  )
`);

// Handle form submission
app.post('/submit', (req, res) => {
  const positions = Array.isArray(req.body.position)
    ? req.body.position
    : req.body.position ? [req.body.position] : [];

  const stmt = db.prepare(`
    INSERT INTO submissions (
      fullName, gradYear, email, phone, occupation,
      positions, positionOther, motivation, experience,
      commitment, meetings, declaration, signature, date, createdAt
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);

  stmt.run(
    req.body.fullName,
    req.body.gradYear,
    req.body.email,
    req.body.phone,
    req.body.occupation || '',
    JSON.stringify(positions),
    req.body.positionOther || '',
    req.body.motivation || '',
    req.body.experience || '',
    req.body.commitment || '',
    req.body.meetings || '',
    req.body.declaration ? 1 : 0,
    req.body.signature || '',
    req.body.date || '',
    new Date().toISOString(),
    function (err) {
      if (err) return res.status(500).json({ ok: false, error: err.message });
      res.json({ ok: true, id: this.lastID });
    }
  );
});

// Endpoint to view submissions
app.get('/submissions', (req, res) => {
  db.all('SELECT * FROM submissions ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ ok: false, error: err.message });
    res.json(rows.map(r => ({ ...r, positions: JSON.parse(r.positions || '[]') })));
  });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
