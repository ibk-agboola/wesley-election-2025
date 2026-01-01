const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();

// Allow requests from your frontend (you can restrict this later)
app.use(cors());

// Parse JSON and form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// SQLite database
const db = new sqlite3.Database(path.join(__dirname, 'wesley_eoi.db'));

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

// Submit form
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
    req.body.occupation,
    JSON.stringify(positions),
    req.body.positionOther,
    req.body.motivation,
    req.body.experience,
    req.body.commitment,
    req.body.meetings,
    req.body.declaration,
    req.body.signature,
    req.body.date,
    new Date().toISOString(),
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).send("Error saving submission");
      }
      res.json({ message: "Submission saved successfully" });
    }
  );
});

// View submissions
app.get('/submissions', (req, res) => {
  db.all('SELECT * FROM submissions ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) return res.status(500).send("Error retrieving submissions");
    res.json(rows);
  });
});

// Render requires dynamic port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
